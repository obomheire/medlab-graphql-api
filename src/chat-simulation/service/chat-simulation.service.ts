import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  AIAvatarInput,
  AIAvatarUpdateInput,
  ChannelInput,
  ChannelUpdateInput,
  ChatEpisodeInput,
  EpisodeContent,
  EventInput,
  EventUpdateInput,
  MasterOutlineTypes,
  SimulationQuizAndPollInput,
  SimulationUpdateInputDto,
  UpdateGeneratedSimulationRecordDto,
  UploadedEpisodeInput,
  UploadedEpisode,
  AddChatEpisodesInput,
} from '../dto/chat-simulation.input';
import { InjectModel } from '@nestjs/mongoose';
import {
  ChatCategoryDocument,
  ChatCategoryEntity,
} from '../entities/chat-category.entity';
import mongoose, { Model, PipelineStage } from 'mongoose';
import { ObjectId } from 'mongodb';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import {
  ChatChannelDocument,
  ChatChannelEntity,
} from '../entities/chat-channel.entity';
import {
  ChatEventDocument,
  ChatEventEntity,
} from '../entities/chat-event.entity';
import { ChatAIAvatarEntity } from '../entities/chat.avatar.entity';
import { ChatEpisodeEntity } from '../entities/chat-episode-entity';
import {
  AIGeneratedEpisodeOutlineRes,
  ChatCategoryRes,
  ChatEpisodeRes,
  GeneratedSimulationRes,
  GetAvatars,
  GetScheduledSimulationRes,
  GroupedChatEpisodes,
  SimulationPoll,
  SimulationQuiz,
  SimulationQuizAndPoll,
  SimulationUpdateRes,
} from '../types/chat.types';
import { ConfigService } from '@nestjs/config';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { UserService } from 'src/user/service/user.service';
import { ThreadMessageInput } from 'src/llm-providers/openAI/dto/assistant.input';
import {
  aiGeneratedOutline,
  eventTemplateToMarkdown,
  formatSimulationToJson,
  manualAIGenerateOutline,
  masterOutlineToJson,
  _simulationPrompt,
  _updateSimulationWithUserPrompt,
} from '../constants/prompt.constant';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import {
  multichoicePrompt,
  openEndedPrompt,
  pollPrompt,
} from '../constants/engagement.constant';
import { extname, join } from 'path';
import ShortUniqueId from 'short-unique-id';
import { EpisodeStatus, ScheduleType } from '../enums/chat-simuation.enum';
import {
  ChatSimulationDocument,
  ChatSimulationEntity,
} from '../entities/chat-simulation-entity';
import { DateTime } from 'luxon';
import {
  AICharacterEntityType,
  ConvertSimulationType,
  MasterOutlineRes,
} from '../entities/types.entity';
import {
  getPagination,
  isValidJSON,
  parseSegments,
  retryWithDelay,
  textToFileUpload,
} from 'src/utilities/service/helpers.service';
import { Pagination } from 'src/quiz/types/quiz.types';
import { ChatAIRolesEntity } from '../entities/chat.roles.entity';
import { ChatSimulationMobileService } from './chat-simulation.mobile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eventEmitterType } from 'src/utilities/enum/env.enum';
import { convertDocxToMarkdown } from 'src/utilities/service/convertToMarkDown';
import { UtilitiesService } from 'src/utilities/service/utilities.service';
import { TempFileEntity } from 'src/utilities/entity/tempFile.entity';
import { addDays, addMonths, addYears, subDays } from 'date-fns';
import { QuizAIService } from 'src/llm-providers/openAI/service/ai.quiz.service';
import { fileFormat } from 'src/utilities/constant/utils.costant';
import { UserDocument } from 'src/user/entity/user.entity';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { femaleVoiceId } from 'src/llm-providers/elevenlabs/constatnt/elevenlabs.constant';
import { maleVoiceId } from 'src/llm-providers/elevenlabs/constatnt/elevenlabs.constant';
import {
  SimulationItem,
  SimulationOutput,
  SimulationPayload,
} from 'src/utilities/interface/interface';
import { ChatSimulationQueueService } from 'src/queue/services/chatSimulation.queue.service';
import { defaultImages } from '../constants/data.constant';

@Injectable()
export class ChatSimulationService implements OnModuleInit {
  private readonly uid = new ShortUniqueId({ length: 16 });
  private readonly logger = new Logger(ChatSimulationService.name);

  constructor(
    @InjectModel(ChatCategoryEntity.name)
    private chatCategoryModel: Model<ChatCategoryEntity>,
    @InjectModel(ChatChannelEntity.name)
    private ChatChannelModel: Model<ChatChannelEntity>,
    @InjectModel(ChatEventEntity.name)
    private chatEventModel: Model<ChatEventEntity>,
    @InjectModel(ChatAIAvatarEntity.name)
    private chatAIAvatarModel: Model<ChatAIAvatarEntity>,
    @InjectModel(ChatEpisodeEntity.name)
    private chatEpisodeModel: Model<ChatEpisodeEntity>,
    @InjectModel(ChatAIRolesEntity.name)
    private chatAIRolesModel: Model<ChatAIRolesEntity>,
    @InjectModel(ChatSimulationEntity.name)
    private chatSimulationModel: Model<ChatSimulationEntity>,
    private awsS3Service: AwsS3Service,
    private readonly configService: ConfigService,
    private asstThreadService: AsstThreadService,
    private userService: UserService,
    @Inject(forwardRef(() => ChatSimulationMobileService))
    private chatSimulationMobileService: ChatSimulationMobileService,
    private utilitiesService: UtilitiesService,
    private quizAIService: QuizAIService,
    private eventEmitter: EventEmitter2,
    private readonly chatSimulationQueueService: ChatSimulationQueueService,
  ) {}

  async onModuleInit() {
    this.convertEpisodesToJson(); // Add userSimulation to episodes if not present
    // this.handleSimulationScheduling(); // To be deleted
  }

  async addChatCategory(name: string): Promise<string> {
    try {
      const createCategory = new this.chatCategoryModel({
        name,
      });

      return await createCategory
        .save()
        .then((res) => {
          return 'Category created successfully';
        })
        .catch((error) => {
          if (error?.message.includes('E11000')) {
            throw new BadRequestException(
              'Catgegory with same name already exist',
            );
          } else {
            throw new BadRequestException(error?.message);
          }
        });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async updateChatCategory(
    name: string,
    categoryUUID: string,
  ): Promise<string> {
    try {
      const updatePayload = {
        name,
      };

      const updateCategory = await this.chatCategoryModel.findOneAndUpdate(
        { categoryUUID },
        {
          $set: updatePayload,
        },
        {
          new: true,
        },
      );

      if (updateCategory.isModified) {
        return 'Category successfully update';
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async deleteChatCategory(categoryUUID: string): Promise<string> {
    try {
      return await this.chatCategoryModel
        .findOneAndDelete({ categoryUUID })
        .then((res) => {
          return 'Category is successfully deleted';
        })
        .catch((error) => {
          throw new BadRequestException(error?.message);
        });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatCategories(): Promise<ChatCategoryDocument[]> {
    try {
      const categories = await this.chatCategoryModel.find().populate({
        path: 'channels',
        select: 'categoryName description channelUUID name',
      });

      return categories;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get 5 random categories with 3 random channels each
  async getRandomChatCategories(): Promise<ChatCategoryRes[]> {
    try {
      const categories: ChatCategoryRes[] =
        await this.chatCategoryModel.aggregate([
          { $sample: { size: 10 } }, // Random 10 categories

          // Lookup channels
          {
            $lookup: {
              from: 'chatchannelentities',
              localField: 'channels',
              foreignField: '_id',
              as: 'channels',
            },
          },
          { $unwind: '$channels' },

          // Lookup events for each channel
          {
            $lookup: {
              from: 'chatevententities',
              localField: 'channels.events',
              foreignField: '_id',
              as: 'channels.events',
            },
          },
          { $unwind: '$channels.events' },

          // Lookup episodes for each event
          {
            $lookup: {
              from: 'chatepisodeentities',
              localField: 'channels.events.episodes',
              foreignField: '_id',
              as: 'channels.events.episodes',
            },
          },

          // Add a field to check if any episode is not Queued
          {
            $addFields: {
              'channels.events.hasNonQueuedEpisodes': {
                $anyElementTrue: {
                  $map: {
                    input: '$channels.events.episodes',
                    as: 'episode',
                    in: { $ne: ['$$episode.status', EpisodeStatus.QUEUED] },
                  },
                },
              },
            },
          },

          // Filter out events where all episodes are Queued (hasNonQueuedEpisodes = false)
          // and events with no episodes
          {
            $match: {
              'channels.events.hasNonQueuedEpisodes': true,
              'channels.events.episodes.0': { $exists: true },
            },
          },

          // Group valid events back to their channels
          {
            $group: {
              _id: {
                categoryId: '$_id',
                channelId: '$channels._id',
              },
              categoryName: { $first: '$name' },
              categoryUUID: { $first: '$categoryUUID' },
              channelName: { $first: '$channels.name' },
              channelUUID: { $first: '$channels.channelUUID' },
              coverImage: { $first: '$channels.coverImage' },
              description: { $first: '$channels.description' },
            },
          },

          // Group valid channels back to their categories
          {
            $group: {
              _id: '$_id.categoryId',
              name: { $first: '$categoryName' },
              categoryUUID: { $first: '$categoryUUID' },
              allChannels: {
                $push: {
                  name: '$channelName',
                  channelUUID: '$channelUUID',
                  coverImage: '$coverImage',
                  description: '$description',
                },
              },
            },
          },

          // Filter categories with at least one valid channel
          {
            $match: {
              'allChannels.0': { $exists: true },
            },
          },

          // Add random field to each channel and then select top 3
          {
            $addFields: {
              channels: {
                $slice: [
                  {
                    $map: {
                      input: '$allChannels',
                      as: 'channel',
                      in: {
                        channel: '$$channel',
                        rand: { $rand: {} },
                      },
                    },
                  },
                  3,
                ],
              },
            },
          },

          // Sort by random field and take first 3
          {
            $addFields: {
              channels: {
                $slice: [
                  {
                    $map: {
                      input: {
                        $sortArray: {
                          input: '$channels',
                          sortBy: { rand: 1 },
                        },
                      },
                      as: 'sorted',
                      in: '$$sorted.channel',
                    },
                  },
                  3,
                ],
              },
            },
          },

          {
            $project: {
              name: 1,
              categoryUUID: 1,
              channels: 1,
            },
          },
        ]);

      return categories;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get chat categories on the podcast app
  async getPodcastChatCategories(
    page: number,
    limit: number,
  ): Promise<{ categories: ChatCategoryEntity[]; pagination: Pagination }> {
    try {
      const skip = (page - 1) * limit;

      const [categories, countResult] = await Promise.all([
        this.chatCategoryModel.aggregate([
          { $sort: { _id: -1 } },
          // Lookup channels
          {
            $lookup: {
              from: 'chatchannelentities',
              localField: 'channels',
              foreignField: '_id',
              as: 'channels',
            },
          },
          { $unwind: '$channels' },
          // Lookup events
          {
            $lookup: {
              from: 'chatevententities',
              localField: 'channels.events',
              foreignField: '_id',
              as: 'channels.events',
            },
          },
          { $unwind: '$channels.events' },
          // Lookup episodes
          {
            $lookup: {
              from: 'chatepisodeentities',
              localField: 'channels.events.episodes',
              foreignField: '_id',
              as: 'channels.events.episodes',
            },
          },
          // Filter out events with no episodes or all episodes Queued
          {
            $addFields: {
              'channels.events.validEpisodes': {
                $filter: {
                  input: '$channels.events.episodes',
                  as: 'episode',
                  cond: {
                    $and: [
                      { $ifNull: ['$$episode.status', false] },
                      { $ne: ['$$episode.status', EpisodeStatus.QUEUED] },
                    ],
                  },
                },
              },
            },
          },
          // Only keep events with valid episodes
          {
            $match: {
              'channels.events.validEpisodes.0': { $exists: true },
            },
          },
          // Group by category and channel
          {
            $group: {
              _id: {
                categoryId: '$_id',
                channelId: '$channels._id',
              },
              categoryName: { $first: '$name' },
              categoryUUID: { $first: '$categoryUUID' },
              channelName: { $first: '$channels.name' },
              channelUUID: { $first: '$channels.channelUUID' },
              coverImage: { $first: '$channels.coverImage' },
              description: { $first: '$channels.description' },
            },
          },
          // Group by category
          {
            $group: {
              _id: '$_id.categoryId',
              name: { $first: '$categoryName' },
              categoryUUID: { $first: '$categoryUUID' },
              channels: {
                $push: {
                  name: '$channelName',
                  channelUUID: '$channelUUID',
                  coverImage: '$coverImage',
                  description: '$description',
                  categoryName: '$categoryName',
                  categoryUUID: '$categoryUUID',
                },
              },
            },
          },
          // Only keep categories with valid channels
          { $match: { 'channels.0': { $exists: true } } },
          { $skip: skip },
          { $limit: limit },
        ]),

        // Count total with same filters
        this.chatCategoryModel.aggregate([
          {
            $lookup: {
              from: 'chatchannelentities',
              localField: 'channels',
              foreignField: '_id',
              as: 'channels',
            },
          },
          { $unwind: '$channels' },
          {
            $lookup: {
              from: 'chatevententities',
              localField: 'channels.events',
              foreignField: '_id',
              as: 'channels.events',
            },
          },
          { $unwind: '$channels.events' },
          {
            $lookup: {
              from: 'chatepisodeentities',
              localField: 'channels.events.episodes',
              foreignField: '_id',
              as: 'channels.events.episodes',
            },
          },
          {
            $addFields: {
              'channels.events.validEpisodes': {
                $filter: {
                  input: '$channels.events.episodes',
                  as: 'episode',
                  cond: {
                    $and: [
                      { $ifNull: ['$$episode.status', false] },
                      { $ne: ['$$episode.status', 'Queued'] },
                    ],
                  },
                },
              },
            },
          },
          {
            $match: {
              'channels.events.validEpisodes.0': { $exists: true },
            },
          },
          {
            $group: {
              _id: {
                categoryId: '$_id',
                channelId: '$channels._id',
              },
            },
          },
          {
            $group: {
              _id: '$_id.categoryId',
            },
          },
          {
            $count: 'totalRecords',
          },
        ]),
      ]);

      const totalRecords = countResult[0]?.totalRecords || 0;
      const totalPages = Math.ceil(totalRecords / limit);

      const pagination: Pagination = {
        totalRecords,
        totalPages,
        pageSize: categories.length,
        prevPage: page > 1 ? page - 1 : null,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
      };

      return { categories, pagination };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatCategory(categoryUUID: string): Promise<ChatCategoryDocument> {
    try {
      const found = await this.chatCategoryModel
        .findOne({ categoryUUID })
        .populate({
          path: 'channels',
          select: 'categoryName description channelUUID name',
        });

      if (!found) {
        throw new NotFoundException('No category found!');
      }

      return found;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatCategoryByName(
    categoryName: string,
  ): Promise<ChatCategoryDocument> {
    try {
      const found = await this.chatCategoryModel
        .findOne({
          name: { $regex: `^${categoryName}$`, $options: 'i' },
        })
        .populate({
          path: 'channels',
          select: 'categoryName description channelUUID name',
        });

      if (!found) {
        throw new NotFoundException('No category found!');
      }

      return found;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Section for channel
  async addChatChannels(payloads: ChannelInput[]): Promise<string> {
    try {
      // Create an array to store the results of the bulk create operation
      const results = [];

      for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i];

        // If coverImage is null, remove it from payload so Mongoose will use the default
        if (payload?.coverImage === null) {
          delete payload?.coverImage;
        }

        // Retrieve the category by name
        const category = await this.getChatCategoryByName(
          payload?.categoryName,
        ).catch((error) => {
          if (error?.message?.includes('No category found!')) {
            throw new BadRequestException(
              'No category found with the given name',
            );
          } else {
            throw new BadRequestException(error?.message);
          }
        });

        // Create the channel instance for each payload
        const createChannel = new this.ChatChannelModel({
          ...payload,
        });

        try {
          const channel = await createChannel.save();
          await this.addIdToReferenceModel(
            channel.id,
            category?.categoryUUID,
            this.chatCategoryModel,
            'channels',
            'categoryUUID',
          );
          results.push({ success: true, channelName: payload.name });
        } catch (error) {
          if (error?.message.includes('E11000')) {
            results.push({
              success: false,
              error: 'Channel with same name already exists',
              channelName: payload.name,
            });
          } else {
            results.push({
              success: false,
              error: error?.message,
              channelName: payload.name,
            });
          }
        }
      }

      // If all operations succeeded, return success message
      const failedResults = results.filter((result) => !result.success);
      if (failedResults.length > 0) {
        throw new BadRequestException(
          `Failed to create channels: ${failedResults
            .map((result) => result.channelName)
            .join(', ')}`,
        );
      }

      return 'Channels created successfully';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async updateChatChannel(
    payload: Partial<ChannelUpdateInput>,
    coverImage?: FileUpload,
  ): Promise<string> {
    try {
      let imageUrl: string;

      if (coverImage) {
        // Save image to S3
        const { createReadStream } = await coverImage;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          'chat-simulation-images',
          stream,
        );

        imageUrl = secure_url;
      }

      const updatePayload = {
        ...payload,
        ...(imageUrl && { coverImage: imageUrl }),
      };

      const { channelUUID } = payload;
      let prevCategoryName: any;
      let channel: any;
      let category: ChatCategoryDocument;

      if (payload?.categoryName) {
        channel = await this.getChatChannel(payload?.channelUUID);
        const { categoryName: existingcategoryName } = channel;

        if (
          existingcategoryName?.toLowerCase() !==
          payload?.categoryName?.toLowerCase()
        ) {
          prevCategoryName = existingcategoryName;
        }
        category = await this.getChatCategoryByName(
          payload?.categoryName,
        ).catch((error) => {
          if (error?.message?.includes('No category found!')) {
            throw new BadRequestException(
              "You are trying to perform an update with a category name that doesn't exist",
            );
          } else {
            throw new BadRequestException(error?.message);
          }
        });
      }

      const updateChannel = await this.ChatChannelModel.findOneAndUpdate(
        { channelUUID },
        {
          $set: updatePayload,
        },
        {
          new: true,
        },
      );

      if (updateChannel.isModified) {
        if (prevCategoryName) {
          const prevCategory = await this.getChatCategoryByName(
            prevCategoryName,
          );
          await this.deleteIdFromReferenceModel(
            channel?.id,
            prevCategory?.categoryUUID,
            this.chatCategoryModel,
            'channels',
            'categoryUUID',
          );
          await this.addIdToReferenceModel(
            updateChannel?.id, // The ObjectId to be added
            category?.categoryUUID, //The UUID to be filtered with on the model
            this.chatCategoryModel, // targetted model to add ObjectID to
            'channels', // the reference array name
            'categoryUUID', //The filter property field
          );
          return 'Channel successfully updated';
        } else {
          return 'Channel successfully updated';
        }
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async deleteChatChannel(channelUUID: string): Promise<string> {
    try {
      const foundChannel = await this.getChatChannel(channelUUID);
      if (foundChannel) {
        const foundCategory = await this.getChatCategoryByName(
          foundChannel?.categoryName,
        );
        if (foundCategory) {
          const removeID = await this.deleteIdFromReferenceModel(
            foundChannel.id,
            foundCategory?.categoryUUID,
            this.chatCategoryModel,
            'channels',
            'categoryUUID',
          );

          if (removeID) {
            return await this.ChatChannelModel.findOneAndDelete({
              channelUUID,
            }).then(async (res) => {
              return 'Channel successfully deleted';
            });
          }
        } else {
          return await this.ChatChannelModel.findOneAndDelete({
            channelUUID,
          }).then(async (res) => {
            return 'Channel successfully deleted';
          });
        }
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatChannels(): Promise<ChatChannelDocument[]> {
    try {
      return await this.ChatChannelModel.find().populate({
        path: 'events',
        populate: 'episodes',
      });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatChannel(channelUUID: string): Promise<ChatChannelDocument> {
    try {
      const found = await this.ChatChannelModel.findOne({
        channelUUID,
      }).populate({
        path: 'events',
        populate: 'episodes',
      });

      if (!found) {
        throw new NotFoundException('No channel found!');
      }

      return found;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatChannelByName(
    channelName: string,
  ): Promise<ChatChannelDocument> {
    try {
      const found = await this.ChatChannelModel.findOne({
        name: { $regex: `^${channelName}$`, $options: 'i' },
      }).populate({
        path: 'events',
        populate: 'episodes',
      });

      if (!found) {
        throw new NotFoundException('No channel found!');
      }

      return found;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async saveFile(file: FileUpload): Promise<string> {
    try {
      const fileExtension = extname(file.filename).toLowerCase(); // Get file extension

      const { createReadStream, mimetype } = await file;
      const stream = createReadStream();

      const { secure_url } = await this.awsS3Service.uploadFile(
        'chat-simulation-images',
        stream,
        fileExtension,
        mimetype,
      );

      return secure_url;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Section for events
  async addChatEvent(
    payload: EventInput,
    coverImage?: FileUpload,
    eventTemplate?: FileUpload,
    masterOutline?: FileUpload,
    isDraft?: boolean,
    eventUUID?: string,
  ): Promise<ChatEventEntity> {
    try {
      let imageUrl: string;
      let eventTemplateUrl: string;
      let masterOutlineContent: any;
      let eventTemplateContent: string;
      let createdData: ChatEventEntity;

      if (coverImage) {
        // Save image to S3
        const secure_url = await this.saveFile(coverImage);

        imageUrl = secure_url;
      }

      if (eventTemplate) {
        eventTemplateContent = await this.extractOutlineToJson(
          eventTemplate,
          null,
          eventTemplateToMarkdown,
        );
      }

      if (masterOutline) {
        masterOutlineContent = await this.extractMasterOutlineToJSON(
          masterOutline,
        );
      }

      const channel = await this.getChatChannelByName(
        payload?.channelName,
      ).catch((error) => {
        if (error?.message?.includes('No channel found!')) {
          throw new BadRequestException('No channel found with the given name');
        } else {
          throw new BadRequestException(error?.message);
        }
      });

      if (
        !isDraft &&
        (!payload?.aiCharacters ||
          !payload?.channelName ||
          !payload?.description ||
          // !payload?.duration ||
          !payload?.name ||
          // !payload?.noOfPolls ||
          // !payload?.noOfQuestions ||
          // !payload?.pollType ||
          !payload?.scheduled ||
          // !payload?.scheduledType ||
          (!payload?.noOfActors && !payload?.noOfPanelist))
      ) {
        throw new BadRequestException(
          'AI Characters, channel Name, description, scheduled, name, no Of Panelist or no Of Actors, fields are required before the event can be created',
        );
      }

      // Get word count by event duration.
      const wordCount = payload?.duration
        ? this.getWordCount(payload.duration)
        : null;

      if (eventUUID) {
        return await this.updateChatEventNew(
          payload,
          wordCount,
          eventUUID,
          imageUrl,
          eventTemplateUrl,
          eventTemplateContent,
          masterOutlineContent,
        );
      } else {
        const document = {
          ...payload,
          draft: isDraft,
          coverImage: imageUrl ? imageUrl : defaultImages.defaultEventImage,
          eventTemplateUrl: eventTemplateUrl ? eventTemplateUrl : null,
          eventTemplateContent,
          masterOutline: masterOutlineContent ? masterOutlineContent : null,
        };

        if (wordCount) {
          document['wordCount'] = wordCount;
        }

        const createEvent = new this.chatEventModel(document);

        if (isDraft) {
          const created = await createEvent.save().catch((error) => {
            if (error?.message.includes('E11000')) {
              throw new BadRequestException(
                'Event with same name already exist',
              );
            } else {
              throw new BadRequestException(error?.message);
            }
          });
          createdData = created;
        } else {
          const created = await createEvent
            .save()
            .then(async (res) => {
              //Adding the event ObjectId to the reference column in channel model
              if (!isDraft) {
                await this.addIdToReferenceModel(
                  res?.id,
                  channel?.channelUUID,
                  this.ChatChannelModel,
                  'events',
                  'channelUUID',
                );
              }
              return res;
            })
            .catch((error) => {
              if (error?.message.includes('E11000')) {
                throw new BadRequestException(
                  'Event with same name already exist',
                );
              } else {
                throw new BadRequestException(error?.message);
              }
            });
          return (createdData = created);
        }
        return await this.getChatEvent(createdData?.eventUUID);
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async updateChatEventNew(
    payload: EventInput,
    wordCount: number,
    eventUUID: string,
    imageUrl?: string,
    eventTemplateUrl?: string,
    eventTemplateContent?: string,
    masterOutlineUrl?: any,
  ): Promise<ChatEventEntity> {
    try {
      const updatePayload = {
        ...payload,
        ...(imageUrl && { coverImage: imageUrl }),
        ...(eventTemplateUrl && { eventTemplateUrl: eventTemplateUrl }),
        ...(eventTemplateContent && {
          eventTemplateContent: eventTemplateContent,
        }),
        ...(masterOutlineUrl && { masterOutline: masterOutlineUrl }),
      };

      if (wordCount) {
        updatePayload['wordCount'] = wordCount;
      }

      let prevChannelName: any;
      let event: any;
      let channel: ChatChannelDocument;

      if (payload?.channelName) {
        event = await this.getChatEvent(eventUUID);
        const { channelName: existingChannelName } = event;

        if (
          existingChannelName?.toLowerCase() !==
          payload?.channelName?.toLowerCase()
        ) {
          prevChannelName = existingChannelName;
        }

        channel = await this.getChatChannelByName(payload?.channelName).catch(
          (error) => {
            if (error?.message?.includes('No channel found!')) {
              throw new BadRequestException(
                "You are trying to perform an update with a channel name that doesn't exist",
              );
            } else {
              throw new BadRequestException(error?.message);
            }
          },
        );
      }

      const updateEvent = await this.chatEventModel.findOneAndUpdate(
        { eventUUID },
        {
          $set: updatePayload,
        },
        {
          new: true,
        },
      );

      //this section removes the reference id to the previous selected channel. Only if the there was a change in channel selection
      if (updateEvent.isModified) {
        if (prevChannelName) {
          const prevChannel = await this.getChatChannelByName(prevChannelName);
          await this.deleteIdFromReferenceModel(
            event?.id, // The ObjectId to be deleted
            prevChannel?.channelUUID, //The UUID to be filtered with on the model
            this.ChatChannelModel, // targetted model to add ObjectID to
            'events', // the reference array name
            'channelUUID', //The filter property field
          );
          await this.addIdToReferenceModel(
            updateEvent?.id, // The ObjectId to be added
            channel?.channelUUID, //The UUID to be filtered with on the model
            this.ChatChannelModel, // targetted model to add ObjectID to
            'events', // the reference array name
            'channelUUID', //The filter property field
          );
        }
        return await this.getChatEvent(updateEvent?.eventUUID);
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async updateChatEvent(
    payload: Partial<EventUpdateInput>,
    coverImage?: FileUpload,
    eventTemplate?: FileUpload,
    masterOutline?: FileUpload,
    isDraft?: boolean,
  ): Promise<string> {
    try {
      let imageUrl: string;
      let eventTemplateUrl: string;
      let masterOutlineUrl: string;

      if (coverImage) {
        // Save image to S3
        const { createReadStream } = await coverImage;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          'chat-simulation-images',
          stream,
        );

        imageUrl = secure_url;
      }

      if (eventTemplate) {
        // Save image to S3
        const { createReadStream } = await eventTemplate;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          'chat-simulation-images',
          stream,
        );

        eventTemplateUrl = secure_url;
      }

      if (masterOutline) {
        // Save image to S3
        const { createReadStream } = await masterOutline;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          'chat-simulation-images',
          stream,
        );

        masterOutlineUrl = secure_url;
      }

      if (
        !isDraft &&
        !payload?.aiCharacters &&
        !payload?.channelName &&
        !payload?.description &&
        !payload?.duration &&
        !payload?.name &&
        !payload?.noOfPolls &&
        !payload?.noOfQuestions &&
        !payload?.poll &&
        !payload?.pollType &&
        !payload?.quiz &&
        !payload?.scheduled &&
        !payload?.scheduledType &&
        (payload?.noOfActors || payload?.noOfPanelist)
      ) {
        throw new BadRequestException(
          'All fields are required before event can be created',
        );
      }

      // Get word count by event duration. Duration is default to 25 minutes
      const wordCount = payload?.duration
        ? this.getWordCount(payload.duration)
        : null;

      const { aiCharacters, ...newPayload } = payload;

      const updatePayload = {
        ...payload,
        ...(imageUrl && { coverImage: imageUrl }),
        ...(eventTemplateUrl && { eventTemplateUrl: eventTemplateUrl }),
        ...(masterOutlineUrl && { masterOutline: masterOutlineUrl }),
      };

      if (wordCount) {
        updatePayload['wordCount'] = wordCount;
      }

      const { eventUUID } = payload;
      let prevChannelName: any;
      let event: any;
      let channel: ChatChannelDocument;

      if (payload?.channelName) {
        event = await this.getChatEvent(payload?.eventUUID);
        const { channelName: existingChannelName } = event;

        if (
          existingChannelName?.toLowerCase() !==
          payload?.channelName?.toLowerCase()
        ) {
          prevChannelName = existingChannelName;
        }

        channel = await this.getChatChannelByName(payload?.channelName).catch(
          (error) => {
            if (error?.message?.includes('No channel found!')) {
              throw new BadRequestException(
                "You are trying to perform an update with a channel name that doesn't exist",
              );
            } else {
              throw new BadRequestException(error?.message);
            }
          },
        );
      }

      const updateEvent = await this.chatEventModel.findOneAndUpdate(
        { eventUUID },
        {
          $set: updatePayload,
        },
        {
          new: true,
        },
      );

      //this section removes the reference id to the previous selected channel. Only if the there was a change in channel selection
      if (updateEvent.isModified) {
        if (prevChannelName) {
          const prevChannel = await this.getChatChannelByName(prevChannelName);
          await this.deleteIdFromReferenceModel(
            event?.id, // The ObjectId to be deleted
            prevChannel?.channelUUID, //The UUID to be filtered with on the model
            this.ChatChannelModel, // targetted model to add ObjectID to
            'events', // the reference array name
            'channelUUID', //The filter property field
          );
          await this.addIdToReferenceModel(
            updateEvent?.id, // The ObjectId to be added
            channel?.channelUUID, //The UUID to be filtered with on the model
            this.ChatChannelModel, // targetted model to add ObjectID to
            'events', // the reference array name
            'channelUUID', //The filter property field
          );
          return 'Event successfully updated';
        } else {
          return 'Event successfully updated';
        }
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async deleteChatEvent(eventUUID: string): Promise<string> {
    try {
      const foundEvent = await this.getChatEvent(eventUUID);
      if (foundEvent) {
        const foundChannel = await this.getChatChannelByName(
          foundEvent?.channelName,
        );
        if (foundChannel) {
          const removeID = await this.deleteIdFromReferenceModel(
            foundEvent.id,
            foundChannel?.channelUUID,
            this.ChatChannelModel,
            'events',
            'channelUUID',
          );

          if (removeID) {
            return await this.chatEventModel
              .findOneAndDelete({ eventUUID })
              .then(async (res) => {
                return 'Event successfully deleted';
              });
          }
        } else {
          return await this.chatEventModel
            .findOneAndDelete({ eventUUID })
            .then(async (res) => {
              return 'Event successfully deleted';
            });
        }
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatEvents(isDraft = false): Promise<ChatEventDocument[]> {
    try {
      return await this.chatEventModel
        .find({ draft: isDraft })
        .populate('episodes')
        .exec();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatEvent(eventUUID: string): Promise<ChatEventDocument> {
    try {
      const found = await this.chatEventModel
        .findOne({ eventUUID })
        .populate('episodes');

      if (!found) {
        throw new NotFoundException('No event found!');
      }

      return found;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getChatEventByName(eventName: string): Promise<ChatEventDocument> {
    try {
      const found = await this.chatEventModel
        .findOne({
          name: { $regex: `^${eventName}$`, $options: 'i' },
        })
        .populate('episodes');

      if (!found) {
        throw new NotFoundException('No event found!');
      }

      return found;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Adding AI Avatars
  async addChatAIAvatar(payloads: AIAvatarInput[]): Promise<string> {
    const errors: string[] = []; // To collect errors for each payload

    for (const payload of payloads) {
      const createAvatar = new this.chatAIAvatarModel({
        ...payload,
      });

      try {
        await createAvatar.save();
      } catch (error) {
        if (error?.message.includes('E11000')) {
          // Handle duplicate name error
          errors.push(
            `AI avatar with the name "${payload.name}" already exists`,
          );
        } else {
          errors.push(
            `Error saving avatar "${payload.name}": ${error.message}`,
          );
        }
      }
    }

    // Provide a summary of the operation
    if (errors.length > 0) {
      throw new BadRequestException(
        `Some avatars failed to be added: ${errors.join(', ')}`,
      );
    }

    return 'All AI avatars added successfully';
  }

  async udpdateAvatar(payloads: AIAvatarUpdateInput[]): Promise<string> {
    try {
      const updatedAIAvatarID = [];
      for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i];

        // Create the character instance for each payload
        const createAvatar = new this.chatAIAvatarModel({
          ...payload,
        });
        const updateAvatar = await this.chatAIAvatarModel.findOneAndUpdate(
          {
            avatarUUID: payload?.avartUUID,
          },
          {
            $set: { status: true },
          },
          {
            new: true,
          },
        );
        if (updateAvatar.isModified)
          updatedAIAvatarID.push(updateAvatar.avatarUUID);
      }
      return `The following Avatars were updated: ${updatedAIAvatarID.join(
        ',',
      )}`;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async deleteAiAvatar(avatarUUID: string): Promise<string> {
    try {
      await this.getAvatar(avatarUUID);
      await this.chatAIAvatarModel.findOneAndDelete({ avatarUUID });
      return 'Avatar successfully deleted';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getAvatars(page = 1, limit = 100): Promise<GetAvatars> {
    try {
      const totalItems = await this.chatAIAvatarModel.countDocuments();
      const totalPages = Math.ceil(totalItems / limit);

      const data = await this.chatAIAvatarModel
        .find()
        .skip((page - 1) * limit) // Skip items for previous pages
        .limit(limit); // Limit the number of items per page

      return {
        page,
        limit,
        totalPages,
        totalItems,
        data,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getAvatar(avatarUUID: string): Promise<ChatAIAvatarEntity> {
    try {
      return await this.chatAIAvatarModel.findOne({ avatarUUID }).exec();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Add episodes with multiple event names
  async addChatEpisodes({
    eventNames = [],
    simulationUUID = '',
  }: AddChatEpisodesInput): Promise<string> {
    try {
      // Check if eventNames is empty and simulationUUID is not provided
      if (!eventNames.length && !simulationUUID) {
        throw new BadRequestException(
          'eventNames or simulationUUID is required',
        );
      }

      let getSimulations: ChatSimulationDocument[];

      if (simulationUUID) {
        getSimulations = [await this.getChatSimulation(simulationUUID)];
      } else {
        const simulationsByEvent = await Promise.all(
          eventNames.map((eventName) =>
            this.getSimulationsByEventName(eventName),
          ),
        );

        getSimulations = simulationsByEvent.flat();
      }

      // Get the last episode for each event
      const getEpisodes = await this.chatEpisodeModel
        .find({ eventName: { $in: eventNames } })
        .sort({ episode: -1 })
        .exec();

      // Create a map of last episode numbers for each event
      const lastEpisodesMap = getEpisodes.reduce((acc, episode) => {
        const episodeNumber = parseInt(episode.episode);

        if (!acc[episode.eventName] || acc[episode.eventName] < episodeNumber) {
          acc[episode.eventName] = episodeNumber;
        }
        return acc;
      }, {} as Record<string, number>);

      // Sort the simulations
      const sortedSimulations = getSimulations.sort(
        (a, b) => parseInt(a.episode) - parseInt(b.episode),
      );

      // Prepare payloads with correct episode numbering
      const payloads = sortedSimulations.map((simulation, index) => {
        const lastEpisode = lastEpisodesMap[simulation.eventName] || 0;
        const currentEpisode = lastEpisode + index + 1;
        const { userSimulation = [] } = simulation;

        return {
          episodeTitle: simulation?.episodeTitle,
          eventName: simulation?.eventName,
          episodeTopics: simulation?.episodeTopics,
          episode: currentEpisode.toString(),
          simulationUUID: simulation?.simulationUUID,
          simulation: simulation?.simulation,
          userSimulation: simulation?.userSimulation,
          quiz: simulation?.quiz,
          poll: simulation?.poll,
          scheduled: simulation?.scheduled,
          scheduledType: simulation?.scheduledType,
          threadId: simulation?.threadId,
          description: simulation?.episodeDescription,
          fileUrl: simulation?.fileUrl,
          isUploaded: simulation?.isUploaded,
          duration: simulation?.duration,
          audioSize: simulation?.audioSize,
          eventCoverImage: simulation?.eventCoverImage,
          joinCode: this.uid.rnd(),
          status:
            userSimulation.length > 0
              ? EpisodeStatus.QUEUED
              : EpisodeStatus.PENDING,
        };
      });

      const createdEpisodes = await this.chatEpisodeModel.insertMany(payloads); // Create episodes

      // Update event references
      const uniqueEventNames = [
        ...new Set(createdEpisodes.map((episode) => episode.eventName)),
      ];

      const getEvents = await Promise.all(
        uniqueEventNames.map((eventName) => this.getChatEventByName(eventName)),
      );

      await Promise.all(
        getEvents.map(async (event) => {
          if (!event) return;

          const eventEpisodes = createdEpisodes
            .filter((episode) => episode.eventName === event.name)
            .map((episode) => episode.id);

          await this.addBulkIdsToReferenceModel(
            eventEpisodes,
            event.eventUUID,
            this.chatEventModel,
            'episodes',
            'eventUUID',
          );
        }),
      );

      // Clean up simulations
      const simulationsUUID = payloads.map((payload) => payload.simulationUUID);

      await this.chatSimulationModel.deleteMany({
        simulationUUID: { $in: simulationsUUID },
      });

      this.convertEpisodesToJson(); // Add userSimulation to episodes if not present
      // this.handleSimulationScheduling(); // Schedule simulations

      return 'Episodes created successfully';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get all episodes
  async getAllEpisodes(
    isRSS: boolean,
    page?: number,
    limit?: number,
    eventName?: string,
    episodeTitle?: string,
  ): Promise<ChatEpisodeRes> {
    try {
      const query: any = {};

      if (eventName) {
        query.eventName = eventName;
      }

      if (episodeTitle) {
        query.episodeTitle = episodeTitle;
      }

      if (isRSS) {
        query.fileUrl = { $ne: null };
      }

      const episodes = await this.chatEpisodeModel
        .find(query)
        .sort({ episode: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.chatEpisodeModel,
        query,
        episodes,
        limit,
        page,
      );

      return { episodes, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get episode by ID
  async getEpisodeById(episodeUUID: string): Promise<ChatEpisodeEntity> {
    try {
      const episode = await this.chatEpisodeModel
        .findOne({ episodeUUID })
        .exec();

      if (!episode) {
        throw new NotFoundException(
          `Episode with UUID ${episodeUUID} not found`,
        );
      }
      return episode;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get episodes by name
  async getEpisodesByName(
    episodeTitle: string,
    eventName: string,
  ): Promise<ChatEpisodeEntity[]> {
    try {
      return await this.chatEpisodeModel
        .find({ episodeTitle: new RegExp(episodeTitle, 'i'), eventName })
        .exec();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get episode by ID
  async getEpisodeByJoinCode(joinCode: string): Promise<ChatEpisodeEntity> {
    try {
      const episode = await this.chatEpisodeModel
        .findOne({ joinCode })
        .select('eventName episode')
        .exec();

      if (!episode) {
        throw new NotFoundException(
          `Episode with join code ${joinCode} not found`,
        );
      }
      return episode;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Update an episode
  async updateEpisode(
    episodeUUID: string,
    updateData: Partial<ChatEpisodeEntity>,
  ): Promise<ChatEpisodeEntity> {
    try {
      const updatedEpisode = await this.chatEpisodeModel
        .findByIdAndUpdate(episodeUUID, updateData, { new: true })
        .exec();
      if (!updatedEpisode) {
        throw new NotFoundException(
          `Episode with UUID ${episodeUUID} not found`,
        );
      }
      return updatedEpisode;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Delete an episode
  async deleteEpisode(episodeUUID: string): Promise<boolean> {
    try {
      const result = await this.chatEpisodeModel
        .findByIdAndDelete({ episodeUUID })
        .exec();
      if (!result) {
        throw new NotFoundException(
          `Episode with UUID ${episodeUUID} not found`,
        );
      }
      const event = await this.getChatEventByName(result?.eventName);
      await this.deleteIdFromReferenceModel(
        result?.id,
        event?.eventUUID,
        this.chatEventModel,
        'episodes',
        'eventUUID',
      );
      return true;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // get calander data
  async getEpisodesForCalendar(
    startDate?: string,
    endDate?: string,
  ): Promise<GroupedChatEpisodes[]> {
    try {
      const pipeline: PipelineStage[] = [];

      // Add the $match stage if startDate and endDate are provided
      if (startDate && endDate) {
        pipeline.push({
          $match: {
            scheduled: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          },
        });
      }

      // Add the $group stage
      pipeline.push({
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduled' } },
          episodes: { $push: '$$ROOT' },
        },
      });

      pipeline.push({
        $sort: { _id: 1 },
      });

      const groupedEpisodes = await this.chatEpisodeModel.aggregate(pipeline);

      return groupedEpisodes.map((group) => ({
        scheduledDate: group._id,
        episodes: group.episodes,
      }));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Get all quizzes
  async getQuizzesByChatEventName(
    eventName: string,
  ): Promise<SimulationQuiz[]> {
    try {
      const episodes = await this.chatEpisodeModel.find({ eventName }).exec();

      if (!episodes || episodes.length === 0) {
        throw new NotFoundException(
          `No episodes found for event name: ${eventName}`,
        );
      }

      // Extract quizzes from all episodes and flatten them into a single array
      const quizzes = episodes.flatMap((episode) => episode.quiz || []);

      return quizzes;
    } catch (error) {
      throw new Error(`Failed to fetch quizzes: ${error.message}`);
    }
  }

  async getQuizByEventNameAndEpisode(
    eventName: string,
    episode: string,
    requestType: string,
  ): Promise<SimulationQuizAndPoll[]> {
    try {
      const episodes = await this.chatSimulationModel
        .find({ eventName, episode })
        .exec();

      // Extract quizzes from all episodes and flatten them into a single array
      if (requestType === 'quiz') {
        const quiz = episodes.flatMap((episode) => episode.quiz || []);
        return quiz.map((res) => {
          const { options, ...rest } = res;
          return {
            ...rest,
            quizOptions: options,
            pollOptions: [],
          };
        });
      } else {
        const poll = episodes.flatMap((episode) => episode.poll || []);
        return poll.map((res) => {
          const { options, ...rest } = res;
          return {
            ...rest,
            quizOptions: [],
            pollOptions: options,
          };
        });
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Method for updating the quizzes and polls inside a generated simulation episode
  async updatePollAndQuizByEventNameAndEpisode(
    eventName: string,
    episode: string,
    requestType: string,
    payload: SimulationQuizAndPollInput[],
  ): Promise<string> {
    try {
      const episodes = await this.chatSimulationModel
        .findOne({ eventName, episode })
        .exec();

      if (!episodes) {
        throw new NotFoundException(
          `No episodes found for event name: ${eventName}`,
        );
      }

      // Extract quizzes from all episodes and flatten them into a single array
      if (requestType === 'quiz') {
        const newPayload = payload.map((res) => {
          const { quizOptions, pollOptions, ...rest } = res;
          return {
            ...rest,
            options: quizOptions,
          };
        });
        episodes.quiz = newPayload;
        episodes.save();
        episodes.isModified('quiz');
        return 'You have successfully updated quiz under this episode';
      }
      if (requestType === 'poll') {
        const newPayload = payload.map((res) => {
          const { quizOptions, pollOptions, ...rest } = res;
          return {
            ...rest,
            options: pollOptions,
          };
        });
        episodes.poll = newPayload;
        episodes.save();
        episodes.isModified('poll');
        return 'You have successfully updated poll under this episode';
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get a simulation by simulationUUID
  async getChatSimulation(
    simulationUUID: string,
  ): Promise<ChatSimulationDocument> {
    try {
      const simulation = await this.chatSimulationModel
        .findOne({ simulationUUID })
        .exec();

      if (!simulation) {
        throw new NotFoundException(
          `No simulation found for: ${simulationUUID}`,
        );
      }

      return simulation;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get a simulations by simulationUUIDs
  async getChatSimulations(
    simulationUUIDs: string[],
  ): Promise<ChatSimulationDocument[]> {
    try {
      const simulations = await this.chatSimulationModel
        .find({ simulationUUID: { $in: simulationUUIDs } })
        .exec();

      // Check if all simulations exist
      const foundUUIDs = simulations.map((sim) => sim?.simulationUUID);
      const missingUUIDs = simulationUUIDs.filter(
        (uuid) => !foundUUIDs.includes(uuid),
      );

      if (missingUUIDs.length > 0) {
        throw new BadRequestException(
          `Simulations not found for UUIDs: ${missingUUIDs.join(', ')}`,
        );
      }

      return simulations;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async updateSimulationEpisode(
    payload: UpdateGeneratedSimulationRecordDto,
  ): Promise<string> {
    const { simulationUUID } = payload;

    try {
      const updatedEpisode = await this.chatSimulationModel
        .findOneAndUpdate({ simulationUUID }, { $set: payload }, { new: true })
        .exec();

      if (!updatedEpisode) {
        throw new NotFoundException(`No episodes found for: ${simulationUUID}`);
      }

      return 'Simulation record updated successfully';
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to update simulation record',
      );
    }
  }

  // Method for deleting a generated simulation
  async deleteSimulationEpisode(simulationUUID: string): Promise<string> {
    try {
      // Find the episode to delete
      const episodeToDelete = await this.getChatSimulation(simulationUUID);

      const deletedEpisodeNumber = episodeToDelete?.episode;

      // Delete the episode
      await this.chatSimulationModel.deleteOne({ _id: episodeToDelete._id });

      // Find all subsequent episodes
      const subsequentEpisodes = await this.chatSimulationModel
        .find({ episode: { $gt: deletedEpisodeNumber } })
        .sort({ episode: 1 });

      // Update the `episode` field for each subsequent episode
      for (let i = 0; i < subsequentEpisodes.length; i++) {
        const updatedEpisodeNumber = (
          parseInt(deletedEpisodeNumber, 10) + i
        ).toString();
        await this.chatSimulationModel.updateOne(
          { _id: subsequentEpisodes[i]._id },
          { $set: { episode: updatedEpisodeNumber } },
        );
      }

      return 'Simulation successfully deleted!';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // get all simulations by event name
  async getSimulationsByEventName(
    eventName: string,
  ): Promise<ChatSimulationDocument[]> {
    try {
      const getSimulations = await this.chatSimulationModel
        .find({ eventName })
        .sort({ episode: 1 })
        .exec();

      if (!getSimulations?.length) {
        throw new BadRequestException(
          'No simulation episodes for the given event name',
        );
      }

      return getSimulations;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async changeEpisodeStatus(
    episodeUUID: string,
    status: EpisodeStatus,
    joinCode?: string,
  ): Promise<ChatEpisodeEntity> {
    try {
      const filter = joinCode ? { joinCode } : { episodeUUID };

      const updatedEpisode = await this.chatEpisodeModel
        .findOneAndUpdate(filter, { status }, { new: true })
        .exec();

      if (!updatedEpisode) {
        throw new Error('Episode not found');
      }

      return updatedEpisode;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get completed episode
  async updateCompletedSimulation(
    episodeUUID: string,
    simulation: ConvertSimulationType,
  ): Promise<void> {
    try {
      const episode = await this.chatEpisodeModel
        .findOne({ episodeUUID })
        .exec();

      if (!episode) return;

      episode.completedSimulation.push(simulation);
      episode.save();

      return;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //method for mannual isLive status update
  async getCompletedSimulation(
    episodeUUID: string,
  ): Promise<ConvertSimulationType[]> {
    try {
      const episode = await this.chatEpisodeModel
        .findOne({ episodeUUID })
        .select('completedSimulation')
        .exec();

      return episode?.completedSimulation || [];
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // For generating the simulation
  async generateSimulation(
    payload?: ChatEpisodeInput,
    threadId?: string,
    userPrompt?: string,
  ): Promise<string> {
    const { eventName, noOfEpisodes, content: episodeContent } = payload;
    const event = await this.getChatEventByName(eventName);
    const channel = await this.getChatChannelByName(event?.channelName);
    const category = await this.getChatCategoryByName(channel?.categoryName);

    const medScrollId = new ObjectId(
      this.configService.get<string>('MEDSCROLL_ID'),
    );

    const user = await this.userService.getUserByObjectId(medScrollId);

    const simulationPayload = {
      user,
      episodeContent,
      threadId,
      actorCount: event?.noOfActors,
      noOfPanelist: event?.noOfPanelist,
      eventDescription: event?.description,
      eventName: event?.name,
      eventTemplate: event?.eventTemplateContent,
      category: category?.name,
      channelDescription: channel?.description,
      channelName: channel.name,
      characterDetails: event?.aiCharacters,
      userPrompt,
      description: event?.description,
      quizType: event.quizType,
      pollType: event.pollType,
      noOfQuestions: event?.noOfQuestions,
      noOfEpisodes,
      scheduled: event?.scheduled,
      scheduledType: event?.scheduledType,
      isQuiz: event?.quiz,
      isPoll: event?.poll,
      wordCount: event?.wordCount,
      eventCoverImage: event?.coverImage,
    };

    this.saveSimulation(simulationPayload);
    return `Simulation generation is queued`;
  }

  //Method for asking the AI to regenerate a particular episode simulation
  async generateUpdatedSimulation(
    updatePayload: SimulationUpdateInputDto,
    userPrompt?: string,
  ): Promise<SimulationUpdateRes> {
    try {
      const { threadId, duration, eventName } = updatePayload;
      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );
      const user = await this.userService.getUserByObjectId(medScrollId);
      const foundEvent = await this.getChatEventByName(
        updatePayload?.eventName,
      );

      // Get word count by event duration. Duration is default to 25 minutes
      const totalWordCount = duration
        ? this.getWordCount(duration)
        : foundEvent.wordCount;

      let joinedContent = '';

      if (totalWordCount > 1500) {
        let remainingWords = totalWordCount;
        let isFirstBatch = true;

        while (remainingWords > 0) {
          const currentWordCount = Math.min(remainingWords, 1500);
          updatePayload.wordCount = currentWordCount;

          let threadMessageInput: ThreadMessageInput;

          if (isFirstBatch) {
            threadMessageInput = {
              threadId: threadId,
              message: _updateSimulationWithUserPrompt(
                updatePayload,
                userPrompt,
              ),
            };
            isFirstBatch = false;
          } else {
            threadMessageInput = {
              threadId: threadId,
              message: remainingWords <= 1500 ? 'Conclude' : 'Generate more',
            };
          }

          const { message: content } = await this.asstThreadService.addMessage(
            user,
            threadMessageInput,
            ComponentType.CHAT_SIMULATION,
            null,
            [],
            'chat-simulation-images',
          );

          const parsedContent: string = JSON.parse(content)?.simulation;
          joinedContent += parsedContent;
          remainingWords -= currentWordCount;
        }
      } else {
        updatePayload.wordCount = totalWordCount;

        const threadMessageInput: ThreadMessageInput = {
          threadId,
          message: _updateSimulationWithUserPrompt(updatePayload, userPrompt),
        };

        const { message: content } = await this.asstThreadService.addMessage(
          user,
          threadMessageInput,
          ComponentType.CHAT_SIMULATION,
          null,
          [],
          'chat-simulation-images',
        );

        if (!isValidJSON(content)) {
          throw new BadRequestException(
            'The AI was unable to generate the update, please try again!',
          );
        }
        const parsedContent = JSON.parse(content).simulation;
        joinedContent = parsedContent;
      }

      let quizResult = [];
      let pollResult = [];

      if (foundEvent.quiz) {
        quizResult = await this.generateQuiz({
          threadId,
          user,
          topic: updatePayload?.episodeTopics,
          noOfQuestions: updatePayload?.noOfQuestions,
          episode: updatePayload?.episode,
          quizType: updatePayload?.quizType,
        });
      }

      if (foundEvent.poll) {
        pollResult = await this.generatePoll({
          threadId,
          user,
          topic: updatePayload?.episodeTopics,
          noOfQuestions: updatePayload?.noOfQuestions,
          episode: updatePayload?.episode,
          pollType: updatePayload?.pollType,
        });
      }

      const responsePayload = {
        episode: updatePayload?.episode,
        episodeTitle: updatePayload?.episodeTitle,
        quiz: quizResult,
        poll: pollResult,
        simulation: joinedContent,
      };

      const foundEpisode = await this.chatSimulationModel.findOne({
        episode: updatePayload?.episode,
        eventName: updatePayload?.eventName,
      });

      if (foundEpisode) {
        foundEpisode.quiz = quizResult;
        foundEpisode.poll = pollResult;
        foundEpisode.simulation = joinedContent;

        // Save the updated document
        await foundEpisode.save();
      }

      return responsePayload;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for generating quiz
  async generateQuiz(payload: any): Promise<SimulationQuiz[]> {
    try {
      const {
        threadId: initialThreadId,
        user,
        topic,
        noOfQuestions,
        quizType,
      } = payload;

      const noOfOptions = 4; // Fixed number of options
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      let totalCount = 0;
      let threadId = initialThreadId;
      const quizResult = [];

      while (totalCount < noOfQuestions) {
        const remainingQuestions = noOfQuestions - totalCount;

        const quizProptPayload = {
          noOfOptions,
          topic,
          noOfQuestion: remainingQuestions,
        };

        const threadMessageInput: ThreadMessageInput = {
          threadId: threadId,
          message:
            quizType?.toLowerCase() === 'open ended'
              ? openEndedPrompt(noOfQuestions)
              : multichoicePrompt(quizProptPayload),
        };

        const { message: content, threadId: chatThreadId } =
          await this.asstThreadService.addMessage(
            user,
            threadMessageInput,
            ComponentType.CHAT_SIMULATION,
            null,
            [],
            'chat-simulation-images',
          );

        let parsedContent;
        try {
          parsedContent = JSON.parse(content);
        } catch (error) {
          throw new BadRequestException(error?.message);
        }

        const questionsGenerated = parsedContent?.data || [];

        // Add only the required number of questions to match the limit
        const questionsToAdd = questionsGenerated?.slice(0, remainingQuestions);
        quizResult.push(...questionsToAdd);

        totalCount += questionsToAdd?.length;

        // Update threadId if necessary

        if (!threadId && chatThreadId) {
          threadId = chatThreadId;
        }

        // Break if the required number of questions has been reached
        if (totalCount >= noOfQuestions) {
          break;
        }

        await delay(100);
      }

      return quizResult;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Quiz generation failed.',
      );
    }
  }

  async generatePoll(payload: any): Promise<SimulationPoll[]> {
    try {
      const {
        threadId: initialThreadId,
        user,
        topic,
        noOfQuestions,
        pollType,
      } = payload;

      const noOfOptions = 4; // Fixed number of options
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      let totalCount = 0;
      let threadId = initialThreadId;
      const pollResult = [];

      while (totalCount < noOfQuestions) {
        const remainingQuestions = noOfQuestions - totalCount;

        const quizProptPayload = {
          noOfOptions,
          topic,
          noOfQuestions: remainingQuestions,
        };

        const threadMessageInput: ThreadMessageInput = {
          threadId: threadId,
          message: pollPrompt(quizProptPayload),
        };

        const { message: content, threadId: chatThreadId } =
          await this.asstThreadService.addMessage(
            user,
            threadMessageInput,
            ComponentType.CHAT_SIMULATION,
            null,
            [],
            '',
          );

        let parsedContent;
        try {
          parsedContent = JSON.parse(content);
        } catch (error) {
          throw new BadRequestException(error?.message);
        }

        const questionsGenerated = parsedContent?.data || [];

        // Add only the required number of questions to match the limit
        const questionsToAdd = questionsGenerated?.slice(0, remainingQuestions);
        pollResult.push(...questionsToAdd);

        totalCount += questionsToAdd?.length;

        // Update threadId if necessary
        if (!threadId && chatThreadId) {
          threadId = chatThreadId;
        }

        // Break if the required number of questions has been reached
        if (totalCount >= noOfQuestions) {
          break;
        }

        await delay(100);
      }

      pollResult?.forEach((poll) => {
        poll.options = poll?.options?.map((option) => ({
          id: this.uid.rnd(),
          value: option,
          vote: 0,
        }));
      });

      return pollResult;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Quiz generation failed.',
      );
    }
  }

  //Method for fetching simulations that are queued
  async getQueuedSimulations(
    eventName?: string,
    page = 1,
    limit = 10,
  ): Promise<GeneratedSimulationRes> {
    try {
      const matchQuery: Record<string, any> = {};

      if (eventName) {
        matchQuery['eventName'] = eventName;
      }

      const pageSize = Math.max(limit, 1);
      const currentPage = Math.max(page, 1);

      // Query data and total count
      const [data, total] = await Promise.all([
        this.chatSimulationModel
          .find(matchQuery)
          .skip((currentPage - 1) * pageSize)
          .limit(pageSize)
          .sort({ episode: 1 })
          .exec(),
        this.chatSimulationModel.countDocuments(matchQuery).exec(),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      const pagination = {
        totalRecords: total,
        totalPages,
        pageSize: data.length,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        currentPage,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
      };
      return { data, pagination };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for fetching successfully scheduled simulations for table render
  async getScheduledSimulationsByWeek(
    eventName?: string,
  ): Promise<GetScheduledSimulationRes[]> {
    const currentDate = DateTime.now();
    const matchQuery = {
      scheduled: { $exists: true },
    };

    if (eventName) {
      matchQuery['eventName'] = eventName;
    }

    // Aggregation pipeline to group simulations by ISO week number
    const result = await this.chatEpisodeModel.aggregate([
      {
        $match: {
          ...matchQuery,
        },
      },
      {
        $project: {
          weekStart: {
            $isoWeek: '$scheduled', // Group by ISO week number
          },
          episodeUUID: 1,
          episodeTitle: 1,
          episodeTopics: 1,
          episode: 1,
          status: 1,
          scheduled: 1,
        },
      },
      {
        $group: {
          _id: '$weekStart', // Group by week number
          simulations: {
            $push: {
              episodeUUID: '$episodeUUID',
              episodeTitle: '$episodeTitle',
              episodeTopics: '$episodeTopics',
              episode: '$episode',
              status: '$status',
              scheduled: '$scheduled',
            },
          },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by week number (ascending)
      },
    ]);

    // Return the result grouped by week number
    return result.map((weekGroup) => {
      return {
        weekNumber: weekGroup._id, // ISO week number
        simulations: weekGroup.simulations,
      };
    });
  }

  //Helper function for adding and removing reference object ID
  async addIdToReferenceModel(
    id: ObjectId,
    uuid: string,
    model: any,
    parentField: string, //This is the name of the field in the model that has the array of IDs
    uuidFieldName: string, // Name of the UUID field to use in the query
  ): Promise<any> {
    try {
      const query = { [uuidFieldName]: uuid };
      const update = { $push: { [parentField]: id } };

      const result = await model.findOneAndUpdate(
        query,
        update,
        { new: true }, // Return the updated document
      );

      if (!result) {
        throw new NotFoundException('Document not found!');
      }
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to update document',
      );
    }
  }

  async addBulkIdsToReferenceModel(
    ids: ObjectId[], // Array of ObjectIds to be added
    uuid: string,
    model: any,
    parentField: string, // Name of the field in the model that has the array of IDs
    uuidFieldName: string, // Name of the UUID field to use in the query
  ): Promise<any> {
    try {
      const query = { [uuidFieldName]: uuid };
      const update = { $addToSet: { [parentField]: { $each: ids } } }; // Use $addToSet with $each to avoid duplicates

      const result = await model.findOneAndUpdate(
        query,
        update,
        { new: true }, // Return the updated document
      );

      if (!result) {
        throw new NotFoundException('Document not found!');
      }

      return result; // Return the updated document
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to update document',
      );
    }
  }

  async deleteIdFromReferenceModel(
    id: ObjectId,
    uuid: string,
    model: any,
    parentField: string, //This is the name of the field in the model that has the array of IDs
    uuidFieldName: string, // Name of the UUID field to use in the query
  ): Promise<any> {
    try {
      const query = { [uuidFieldName]: uuid };
      const update = { $pull: { [parentField]: id } };

      const result = await model.findOneAndUpdate(
        query,
        update,
        { new: true }, // Return the updated document
      );

      if (!result) {
        throw new NotFoundException('Document not found!');
      }
      return result;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to update document',
      );
    }
  }

  async deleteBulkIdsFromReferenceModel(
    ids: ObjectId[], // Array of ObjectIds to remove
    uuid: string,
    model: any,
    parentField: string, // Name of the field in the model that has the array of IDs
    uuidFieldName: string, // Name of the UUID field to use in the query
  ): Promise<any> {
    try {
      const query = { [uuidFieldName]: uuid };
      const update = { $pull: { [parentField]: { $in: ids } } }; // Use $pull with $in to remove multiple IDs

      const result = await model.findOneAndUpdate(
        query,
        update,
        { new: true }, // Return the updated document
      );

      if (!result) {
        throw new NotFoundException('Document not found!');
      }
      return result; // Return the updated document
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to update document',
      );
    }
  }

  async extractOutlineToJson(
    outlineFile: FileUpload,
    threadId?: string,
    prompt?: any,
  ): Promise<any> {
    try {
      if (!outlineFile) {
        throw new BadRequestException(
          'No file uploaded. Please provide a valid file.',
        );
      }

      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );
      const user = await this.userService.getUserByObjectId(medScrollId);

      const fileExtension = extname(outlineFile.filename).toLowerCase(); // Get file extension

      const data = await this.extractText(outlineFile, fileExtension);

      const threadMessageInput: ThreadMessageInput = {
        threadId,
        message: prompt ? prompt(data) : masterOutlineToJson(data),
        // message: prompt ? prompt() : outlineToJson(),
      };

      const { message: content, threadId: chatThreadId } =
        await this.asstThreadService.addMessage(
          user,
          threadMessageInput,
          ComponentType.EVENT_TEMPLATE,
          null,
          [outlineFile],
          'chat-simulation-images',
        );

      if (!isValidJSON(content)) {
        throw new BadRequestException(
          'System is currently busy, please try again.',
        );
      }

      if (!content) {
        throw new BadRequestException(
          'Assistant returned empty content. Please try again.',
        );
      }

      const parsedContent = JSON.parse(content).data;

      return parsedContent;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Unexpected error occurred.',
      );
    }
  }

  //Method for the ai to generate the episode outline and titles
  async aiGenerateEpisodeOutline(
    noOfEpisode: number,
    eventName?: string,
    prompt?: any,
    outlines?: MasterOutlineTypes[],
  ): Promise<AIGeneratedEpisodeOutlineRes[]> {
    try {
      const foundEvent = await this.getChatEventByName(eventName);

      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );
      const user = await this.userService.getUserByObjectId(medScrollId);

      const outline = foundEvent?.masterOutline;
      // const cleanedOutline = outline.replace(/^"|"$/g, '');
      if (!outline) {
        throw new BadRequestException('No master outline found to process');
      }

      const threadMessageInput: ThreadMessageInput = {
        threadId: foundEvent?.masterOutlineThreadId,
        message: aiGeneratedOutline(noOfEpisode, outline, outlines, prompt),
      };

      const { message: content, threadId: chatThreadId } =
        await this.asstThreadService.addMessage(
          user,
          threadMessageInput,
          ComponentType.OUTLINE_TO_JSON,
          null,
          [],
          'chat-simulation-images',
        );

      if (!foundEvent?.masterOutlineThreadId) {
        foundEvent.masterOutlineThreadId = chatThreadId;
        foundEvent.save();
      }

      const parsedContent = JSON.parse(content);
      if (!content) {
        throw new BadRequestException(
          'Assistant returned empty content. Please try again.',
        );
      }

      return parsedContent;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Unexpected error occurred.',
      );
    }
  }

  async uploadMasterOutline(
    eventName: string,
    masterOutline: FileUpload,
  ): Promise<string> {
    try {
      const foundEvent = await this.getChatEventByName(eventName);
      let masterOutlineContent: any;

      if (masterOutline) {
        masterOutlineContent = await this.extractMasterOutlineToJSON(
          masterOutline,
        );
      }
      foundEvent.masterOutline = masterOutlineContent;
      foundEvent.save();
      return `Master outline successfully uploaded`;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Unexpected error occurred.',
      );
    }
  }

  //Method for extracting master outline to json
  async extractMasterOutlineToJSON(
    masterOutline: FileUpload,
  ): Promise<MasterOutlineTypes[]> {
    try {
      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );
      const user = await this.userService.getUserByObjectId(medScrollId);

      const fileExtension = extname(masterOutline.filename).toLowerCase(); // Get file extension
      const data = await this.extractText(masterOutline, fileExtension);

      const threadMessageInput: ThreadMessageInput = {
        threadId: null,
        message: manualAIGenerateOutline(data),
      };

      const { message: content, threadId: chatThreadId } =
        await this.asstThreadService.addMessage(
          user,
          threadMessageInput,
          ComponentType.OUTLINE_TO_JSON,
          null,
          [],
          'chat-simulation-images',
        );

      if (!isValidJSON(content)) {
        throw new BadRequestException(
          'System is currently busy, please try again.',
        );
      }

      if (!content) {
        throw new BadRequestException(
          'Assistant returned empty content. Please try again.',
        );
      }

      return content;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Unexpected error occurred.',
      );
    }
  }

  //method for getting master outline
  async getMasterOutline(eventName: string): Promise<MasterOutlineRes[]> {
    try {
      let masterOutline: MasterOutlineRes[];
      const found = await this.getChatEventByName(eventName);

      if (found && found?.masterOutline) {
        if (!isValidJSON(found.masterOutline)) {
          throw new BadRequestException('master outline is not a valid JSON');
        }

        const outline = JSON.parse(found?.masterOutline);
        masterOutline = outline;
      }

      return masterOutline;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async extractText(file: FileUpload, fileExtension: string): Promise<string> {
    try {
      const { createReadStream } = await file;
      const stream = createReadStream();
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      switch (fileExtension) {
        case '.pdf': {
          const { text } = await pdf(buffer);
          return text;
        }
        case '.docx': {
          const { value } = await mammoth.extractRawText({ buffer });
          return value;
        }
        default:
          throw new BadRequestException(
            'Invalid file type. Please upload a PDF or DOCX file.',
          );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Section for adding ai Roles
  async AddChatAIRoles(role: string): Promise<string> {
    try {
      const found = await this.chatAIRolesModel
        .findOne({ role: { $regex: role, $options: 'i' } })
        .exec();
      if (found) {
        throw new BadRequestException('Role with same name already exist');
      }
      const newRole = new this.chatAIRolesModel({ role });
      return await newRole.save().then((res) => {
        return 'Role added successfully';
      });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //method for fetching roles
  async getAllChatAIRoles(): Promise<ChatAIRolesEntity[]> {
    try {
      return await this.chatAIRolesModel.find().exec();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //This method is used to schedule the episodes by checking the scheduled date and the current date and making them go live (To be deleted)
  async handleSimulationScheduling() {
    try {
      this.logger.debug('Scheduling job started...!');

      // Run the job every minute instead of using while (true)
      const interval = setInterval(async () => {
        try {
          const scheduled = await this.getGroupedEpisodes();

          if (!scheduled.length) {
            this.logger.debug('No more scheduled episodes. Stopping job.');
            clearInterval(interval);
            return;
          }

          for (const episode of scheduled) {
            const currentTime = Date.now();
            const gracePeriod = 60000; // 1-minute grace period

            const scheduledTimeUTC = new Date(episode?.scheduledDate);
            const localOffset =
              scheduledTimeUTC.getTimezoneOffset() * 60 * 1000; // Offset in milliseconds
            const scheduledTimeLocal = scheduledTimeUTC.getTime() - localOffset; // Convert UTC to local time

            // Check if it's live within the last grace period
            // if (this.isLive(episode?.scheduledDate)) { // This is to test locally
            if (scheduledTimeLocal <= currentTime + gracePeriod) {
              const episodeUUIDs = episode?.episodes?.map(
                (res) => res?.episodeUUID,
              );
              await this.updateEpisodeStatus(episodeUUIDs);
            }
          }
        } catch (error) {
          this.logger.error('Error processing scheduled episodes:', error);
        }
      }, 60000); // Run every 60 seconds (1 minute)
    } catch (error) {
      this.logger.error('Episode Scheduling Job failed:', error);
      throw new BadRequestException(error?.message);
    }
  }

  private isLive(dateScheduled: Date, gracePeriod = 60000): boolean {
    const scheduledTimestamp = new Date(dateScheduled).getTime();
    const currentTimestamp = Date.now();

    return (
      scheduledTimestamp <= currentTimestamp &&
      scheduledTimestamp >= currentTimestamp - gracePeriod
    );
  }

  // Method for updating episode status
  async updateEpisodeStatus(episodeUUIDs: string[]): Promise<void> {
    try {
      await Promise.all(
        episodeUUIDs.map(async (episodeUUID) => {
          const updatedEpisode = await this.chatEpisodeModel.findOneAndUpdate(
            { episodeUUID },
            { $set: { status: EpisodeStatus.ONGOING } },
            { new: true },
          );

          if (!updatedEpisode) return;

          // Get event
          const event = await this.getChatEventByName(
            updatedEpisode?.eventName,
          );

          // Get channels episode
          const channelEpisode =
            await this.chatSimulationMobileService.getMobileChannelEpisodes_v2(
              event?.channelName,
            );

          // Emit channels episode
          this.eventEmitter.emit(
            eventEmitterType.CHANNELS_EPISODE,
            channelEpisode,
          );

          // Get channels events
          const channelEvents =
            await this.chatSimulationMobileService.getMobileChannelEvents_v2(
              event?.channelName,
            );

          //Emit channel events
          this.eventEmitter.emit(
            eventEmitterType.CHANNEL_EVENTS,
            channelEvents,
          );

          // Get channel home feed
          const channelHomeFeed =
            await this.chatSimulationMobileService.getChannelHomeFeed();

          // Emit channel home feed
          this.eventEmitter.emit(
            eventEmitterType.CHANNEL_HOME_FEED,
            channelHomeFeed,
          );

          // Get channel
          const channels =
            await this.chatSimulationMobileService.getMobileChannel_v2(
              event.channelName,
            );

          // Emit channel
          this.eventEmitter.emit(eventEmitterType.CHANNEL, channels);

          // Emit live episode
          this.eventEmitter.emit(
            eventEmitterType.LIVE_EPISODE,
            updatedEpisode?.episodeUUID,
            updatedEpisode?.joinCode,
            updatedEpisode?.userSimulation || [],
          );
        }),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Handle webhook for live episodes
  async liveEpisodes(episodeUUIDs: string[]): Promise<void> {
    try {
      // Fetch all episodes in one query
      const episodes = await this.chatEpisodeModel
        .find({ episodeUUID: { $in: episodeUUIDs } })
        .lean()
        .exec();

      // Create a fast lookup map for UUID → episode
      const episodeMap = new Map(episodes.map((e) => [e.episodeUUID, e]));

      // Process each UUID in parallel
      await Promise.all(
        episodeUUIDs.map(async (uuid) => {
          const episode = episodeMap.get(uuid);

          // Skip if episode doesn't exist in DB
          if (!episode) return;

          const {
            eventName,
            episodeUUID,
            joinCode,
            userSimulation = [],
          } = episode;

          // Try to fetch the associated event (case-insensitive match)
          const event = await this.chatEventModel.findOne({
            name: { $regex: `^${eventName}$`, $options: 'i' },
          });

          // If no event found, delete the episode (cleanup invalid entry)
          if (!event) {
            await this.chatEpisodeModel.deleteOne({ episodeUUID });

            return;
          }

          // Skip if event is missing a channel name
          if (!event.channelName) return;

          const channelName = event.channelName;

          // Fetch all channel-related data in parallel
          const [channelEpisode, channelEvents, channelHomeFeed, channels] =
            await Promise.all([
              this.chatSimulationMobileService.getMobileChannelEpisodes_v2(
                channelName,
              ),
              this.chatSimulationMobileService.getMobileChannelEvents_v2(
                channelName,
              ),
              this.chatSimulationMobileService.getChannelHomeFeed(),
              this.chatSimulationMobileService.getMobileChannel_v2(channelName),
            ]);

          // Emit channel-related events to update frontend clients
          this.eventEmitter.emit(
            eventEmitterType.CHANNELS_EPISODE,
            channelEpisode,
          );

          // Emit channel events
          this.eventEmitter.emit(
            eventEmitterType.CHANNEL_EVENTS,
            channelEvents,
          );

          // Emit channel home feed
          this.eventEmitter.emit(
            eventEmitterType.CHANNEL_HOME_FEED,
            channelHomeFeed,
          );

          // Emit channel
          this.eventEmitter.emit(eventEmitterType.CHANNEL, channels);

          // Emit the live episode
          this.eventEmitter.emit(
            eventEmitterType.LIVE_EPISODE,
            episodeUUID,
            joinCode,
            userSimulation,
          );
        }),
      );

      this.logger.debug('Live episodes processed successfully');
    } catch (error) {
      this.logger.error('Error processing live episodes:', error);
    }
  }

  async getGroupedEpisodes(): Promise<GroupedChatEpisodes[]> {
    const currentDate = new Date();
    const gracePeriod = 60000; // 1 minute in milliseconds
    const currentDateWithGrace = new Date(currentDate.getTime() - gracePeriod);

    const groupedEpisodes = await this.chatEpisodeModel.aggregate([
      {
        $match: {
          scheduled: { $gte: currentDateWithGrace }, // Include past 1 minute
          status: { $nin: ['Ongoing', 'Posted'] },
        },
      },
      {
        $group: {
          _id: '$scheduled',
          episodes: { $push: '$$ROOT' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return groupedEpisodes?.map((group) => ({
      scheduledDate: group?._id,
      episodes: group?.episodes,
    }));
  }

  // Save Simulation (Segment-by-Segment Mode)
  async saveSimulation(ptPayload: SimulationPayload): Promise<void> {
    this.logger.debug('Simulation Job started!!');
    try {
      const {
        threadId,
        eventName,
        scheduled,
        scheduledType,
        eventTemplate,
        userPrompt,
        user,
        isQuiz,
        isPoll,
        quizType,
        pollType,
        noOfQuestions,
        eventCoverImage,
        characterDetails,
      } = ptPayload;

      const result = [];

      const parsedSegments = parseSegments(eventTemplate); // Get the different segments from the event template

      // Loop through each episode
      await Promise.all(
        ptPayload?.episodeContent?.map(async (res: EpisodeContent) => {
          const proptPayload: any = {
            ...ptPayload,
            eventName,
            eventTemplate,
            description: res?.description,
            episodeTitle: res?.title,
            episodeTopics: res?.topic,
            characterDetails,
          };

          let joinedContent = '';
          let localThreadId = threadId;

          // Generate each segment one-by-one
          for (let i = 0; i < parsedSegments.length; i++) {
            const threadMessageInput: ThreadMessageInput = {
              threadId: localThreadId,
              message: _simulationPrompt(proptPayload, userPrompt, i),
            };

            const { message: content, threadId: chatThreadId } =
              await retryWithDelay(
                async () =>
                  await this.asstThreadService.addMessage(
                    user,
                    threadMessageInput,
                    ComponentType.CHAT_SIMULATION,
                    null,
                    [],
                    'chat-simulation-images',
                  ),
                3,
                10000,
              );

            const parsedContent: string = JSON.parse(content)?.simulation;
            joinedContent += parsedContent + '\n\n';
            localThreadId = chatThreadId;

            // Optional: delay to allow system to settle
            await new Promise((r) => setTimeout(r, 5000));
          }

          // Store content to results
          result.push({
            episode: res?.episode,
            episodeTitle: res?.title,
            episodeTopics: res?.topic,
            threadId: localThreadId,
            simulation: joinedContent.trim(),
            description: res?.description,
            eventCoverImage,
            characterDetails,
          });
        }),
      );

      // Generate quiz & poll
      await Promise.all(
        result.map(async (item: SimulationItem) => {
          let quizResult = [];
          let pollResult = [];

          if (isQuiz) {
            quizResult = await retryWithDelay(
              () =>
                this.generateQuiz({
                  threadId: item.threadId,
                  user,
                  topic: item.episodeTopics,
                  episode: item.episode,
                  noOfQuestions,
                  quizType,
                }),
              3,
              10000,
            );
          }

          if (isPoll) {
            pollResult = await retryWithDelay(
              () =>
                this.generatePoll({
                  threadId: item.threadId,
                  user,
                  topic: item.episodeTopics,
                  episode: item.episode,
                  noOfQuestions,
                  pollType,
                }),
              3,
              10000,
            );
          }

          Object.assign(item, {
            quiz: quizResult,
            poll: pollResult,
            noOfEpisodes: ptPayload?.noOfEpisodes,
            eventName,
            category: ptPayload?.category,
            channelName: ptPayload?.channelName,
            channelDescription: ptPayload?.channelDescription,
            eventDescription: ptPayload?.eventDescription,
            eventTemplate,
            actorCount: ptPayload?.actorCount,
            quizType,
            pollType,
            noOfQuestions,
            scheduled,
            scheduledType,
          });
        }),
      );

      // Save all episodes to DB
      if (result?.length > 0) {
        await this.chatSimulationModel.insertMany(result);
        await this.updateScheduledDates(eventName, scheduled, scheduledType);
      }

      this.logger.debug('Simulation Job completed!!');
    } catch (error) {
      this.logger.debug('error:: ', error?.message);
    }
  }

  async updateScheduledDates(
    eventName: string,
    startDate: Date,
    scheduleType: ScheduleType,
  ): Promise<any> {
    // Ensure startDate is a valid Date object
    if (!(startDate instanceof Date)) {
      startDate = new Date(startDate); // Convert string or other type to Date
    }

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate provided');
    }

    const records = await this.chatSimulationModel
      .find({ eventName })
      .sort({ episode: 1 });

    const foundEvent = await this.chatEventModel
      .findOne({ name: eventName })
      .populate<{
        episodes: { scheduled: Date; episode: string; episodeTitle: string }[];
      }>({
        path: 'episodes',
        select: 'scheduled episode episodeTitle',
        options: { sort: { episode: -1 } },
      });

    const lastScheduledDate = foundEvent?.episodes[0]?.scheduled
      ? new Date(foundEvent?.episodes[0]?.scheduled)
      : null;

    const lastEpisode = Number(foundEvent?.episodes[0]?.episode);

    await Promise.all(
      records?.map(async (record, index) => {
        const currentDate = new Date();
        const compareDate = lastScheduledDate
          ? new Date(lastScheduledDate)
          : null;
        const newDate =
          compareDate && compareDate?.getDate() < currentDate?.getDate()
            ? new Date()
            : compareDate;
        const isLessthanCurrent =
          compareDate && compareDate?.getDate() < currentDate?.getDate();

        const baseDate = newDate || startDate; // Start from last scheduled or given startDate
        const incrementedDate = new Date(baseDate); // Ensure a new Date object

        switch (scheduleType) {
          case ScheduleType.DAILY:
            const indexToUse = isLessthanCurrent ? index : index + 1;
            incrementedDate?.setDate(baseDate?.getDate() + indexToUse);
            break;
          case ScheduleType.WEEKLY:
            const weekIndex = isLessthanCurrent
              ? index + 1
              : !isLessthanCurrent && lastScheduledDate
              ? index + 1
              : index;
            incrementedDate?.setDate(baseDate?.getDate() + weekIndex * 7);
            break;
          case ScheduleType.MONTHLY:
            const monthIndex = isLessthanCurrent
              ? index + 1
              : !isLessthanCurrent && lastScheduledDate
              ? index + 1
              : index;
            incrementedDate?.setMonth(baseDate?.getMonth() + monthIndex);
            break;
          case ScheduleType.YEARLY:
            const yearIndex = isLessthanCurrent
              ? index + 1
              : !isLessthanCurrent && lastScheduledDate
              ? index + 1
              : index;
            incrementedDate?.setFullYear(baseDate?.getFullYear() + yearIndex);
            break;
          case ScheduleType.NEVER:
            // No increment for NEVER
            break;
          default:
            throw new BadRequestException(
              `Unsupported schedule type: ${scheduleType}`,
            );
        }
        const foundSimulation = await this.getChatSimulation(
          record?.simulationUUID,
        );

        if (foundSimulation) {
          const newIndex = index + 1;
          foundSimulation.scheduled = incrementedDate;
          foundSimulation.scheduledType = scheduleType;
          foundSimulation.episode = String(
            lastEpisode ? lastEpisode + newIndex : newIndex,
          );
          await foundSimulation.save();
        }
      }),
    );
  }

  // Upload episode
  async uploadEpisode(file: FileUpload) {
    try {
      let _secure_url: string;
      let _markdown: string;

      const fileExtension = extname(file.filename).toLowerCase(); // Get file extension

      const isAudio = fileFormat.includes(fileExtension); // Check if file is audio

      // Upload episode to s3 if file is audio
      if (isAudio) {
        const { createReadStream, mimetype } = await file;
        const stream = createReadStream();

        const { secure_url } = await this.awsS3Service.uploadFile(
          'chat-simulation/episode',
          stream,
          fileExtension,
          mimetype,
        ); // upload episode to s3

        _secure_url = secure_url;
      } else {
        _markdown =
          fileExtension === '.pdf'
            ? (await this.convertPdfToMarkdown(file))?.markdown // convert pdf to markdown format
            : (await convertDocxToMarkdown(file))?.markdown; // convert docx to markdown format
      }

      const document: TempFileEntity = {
        content: _markdown,
        fileUrl: _secure_url,
      };

      const { tempFileUUID } = await this.utilitiesService.createTempFile(
        document,
      ); // create temporary file

      return {
        tempFileUUID: isAudio ? null : tempFileUUID,
        fileUrl: isAudio ? _secure_url : null,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Create uploaded episodes
  async createUploadedEpisode(
    user: UserDocument,
    uploadedEpisodeInput: UploadedEpisodeInput,
  ): Promise<{ message: string }> {
    try {
      const { eventUUID, episodes } = uploadedEpisodeInput;

      this.validateEpisode(episodes); // Check for duplicate tempFileUUID and fileURL

      const event = await this.getChatEvent(eventUUID);
      const channel = await this.getChatChannelByName(event?.channelName);
      const category = await this.getChatCategoryByName(channel?.categoryName);

      const tempFileToDelete = (
        await Promise.all(
          episodes.map(async (episode) => {
            const episodeNo = parseInt(episode.episode, 10); // Convert episode number to integer

            if (isNaN(episodeNo) || episodeNo < 1) {
              throw new BadRequestException(
                `Invalid episode number: ${episode.episode}`,
              );
            }

            const { fileUrl, tempFileUUID, ...rest } = episode;

            let scheduledDate = new Date(event?.scheduled); // base date

            // Calculate the scheduled date based on the scheduled type for each episode
            switch (event?.scheduledType) {
              case ScheduleType.DAILY:
                scheduledDate = addDays(scheduledDate, episodeNo - 1);
                break;
              case ScheduleType.WEEKLY:
                scheduledDate = addDays(scheduledDate, (episodeNo - 1) * 7);
                break;
              case ScheduleType.MONTHLY:
                scheduledDate = addMonths(scheduledDate, episodeNo - 1);
                break;
              case ScheduleType.YEARLY:
                scheduledDate = addYears(scheduledDate, episodeNo - 1);
                break;
              case ScheduleType.NEVER:
                scheduledDate = event?.scheduled;
                break;
              default:
                throw new BadRequestException(
                  `Unsupported scheduledType: ${event?.scheduledType}`,
                );
            }

            const fileToDelete: string[] = [];

            // Get simulation from temp file DB or episode?.simulation
            const simulation = await this.utilitiesService.getTempFileByUUID(
              tempFileUUID,
            );

            fileToDelete.push(tempFileUUID); // Collect tempFileUUID to be deleted

            const fileUpload: FileUpload = await textToFileUpload(simulation); // convert simulation to .txt file
            let quiz = [];
            let quizThreadId = '';
            let poll = [];

            // Generate quiz
            if (event?.quiz) {
              const { quizzes, threadId } =
                await this.quizAIService.generateEpisodeQuiz(
                  user,
                  {
                    title: episode?.episodeTitle,
                    noOfQuestions: event?.noOfQuestions || 10,
                    quizType: event?.quizType,
                  },
                  fileUpload,
                );
              quiz = quizzes;
              quizThreadId = threadId;
            }

            const canUploadFile: boolean = quiz.length > 0 && !!quizThreadId; // Check if quiz is generated and quizThreadId is a non-empty string

            // Generate poll
            if (event?.poll) {
              const { polls } = await this.quizAIService.generateEpisodePoll(
                user,
                {
                  title: episode?.episodeTitle,
                  noOfPolls: event?.noOfPolls || 10,
                  quizThreadId,
                },
                canUploadFile ? null : fileUpload,
              );

              poll = polls;
            }

            // Create the episode
            await this.chatSimulationModel.create({
              ...rest,
              eventName: event?.name,
              scheduled: scheduledDate,
              scheduledType: event?.scheduledType,
              category: category?.name,
              channelName: event?.channelName,
              fileUrl,
              simulation,
              characterDetails: event?.aiCharacters,
              noOfEpisodes: episodes?.length,
              channelDescription: channel?.description,
              eventDescription: event?.description,
              noOfQuestions: event?.noOfQuestions,
              quizType: event?.quizType,
              pollType: event?.pollType,
              isUploaded: true,
              quiz,
              poll,
            });

            if (fileUrl) {
              fileToDelete.push(fileUrl); // Collect file URL to be deleted
            }

            return fileToDelete; // Collect array of file UUIDs and file URLs
          }),
        )
      ).flat(); // Flatten the array of arrays into a single array of strings

      await this.utilitiesService._deleteTempFiles(tempFileToDelete); // Delete the temporary files for the submitted episodes

      return { message: `Successfully uploaded ${episodes.length} episodes` };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Generate podcast
  async generatePodcast(user: UserDocument, simulationUUIDs: string[]) {
    try {
      const simulations = await this.getChatSimulations(simulationUUIDs);

      await Promise.all(
        simulations.map((simulation) => {
          simulation.genPodStatus = EpisodeStatus.PENDING;
          return simulation.save();
        }),
      );

      this.chatSimulationQueueService.generatePodcastQueue(
        user,
        simulationUUIDs,
      );

      return { message: 'Podcast generation is successfully queued' };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Convert simulation to json
  async convertSimulationToJson(
    simulation: ChatSimulationDocument,
    user: UserDocument,
  ): Promise<ConvertSimulationType[]> {
    try {
      let speakers: { name: string; image: string; gender: string }[] = [];

      const characterDetails = simulation?.characterDetails;

      if (characterDetails?.length) {
        speakers = characterDetails?.map((res) => ({
          name: res?.name,
          image: res?.image,
          gender: res?.gender,
        }));
      }

      let _threadId: string | null = null;
      let fullParsedData: ConvertSimulationType[] = [];
      let isLastData = false;
      let isFirstRequest = true;

      while (!isLastData) {
        const prompt = isFirstRequest
          ? formatSimulationToJson(simulation?.simulation, speakers) // get prompt for first request
          : 'next data';

        const threadMessageInput: ThreadMessageInput = {
          threadId: _threadId,
          message: prompt,
        };

        let parsedChunk: any;

        // Add message to thread with retry and delay (3 seconds)
        const { message, threadId } = await retryWithDelay(
          async () =>
            await this.asstThreadService.addMessage(
              user,
              threadMessageInput,
              ComponentType.CHAT_SIMULATION,
              null,
              [],
            ),
          5,
          3000, // delay in ms (3 second)
        );

        // Validate JSON
        if (!isValidJSON(message)) {
          parsedChunk = await this.asstThreadService.getValidateJSON(message); // Use chatcompletion to get valid JSON
        } else {
          parsedChunk = JSON.parse(message); // Deserialize the aiMessage
        }

        _threadId = threadId || _threadId;

        fullParsedData = [...fullParsedData, ...(parsedChunk?.data || [])];
        isLastData = parsedChunk?.isLastData || false;
        isFirstRequest = false;
      }

      // Remove first heading if it duplicates the title
      if (fullParsedData) {
        const eventNameTolowercase = simulation?.eventName?.toLowerCase();
        const episodeTitleTolowercase = simulation?.episodeTitle?.toLowerCase();
        const normalizeText = (text: string) =>
          text?.toLowerCase()?.replace(/[-\s]+/g, ' ');

        const isEpisodeTitlePresent = normalizeText(
          fullParsedData[0]?.conversation,
        )?.includes(normalizeText(episodeTitleTolowercase));

        const isEventNamePresent = normalizeText(
          fullParsedData[0]?.conversation,
        )?.includes(normalizeText(eventNameTolowercase));

        if (isEpisodeTitlePresent || isEventNamePresent) {
          fullParsedData.shift();
        }
      }

      return fullParsedData;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Convert episodes to json
  async convertEpisodesToJson(): Promise<void> {
    this.logger.debug('Fetching episodes for simulation conversion...');
    try {
      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );
      const user = await this.userService.getUserByObjectId(medScrollId);

      const eventCache = new Map<string, ChatEventDocument>(); // Create a cache for events

      while (true) {
        const episodes = await this.chatEpisodeModel
          .find({ userSimulation: { $size: 0 } })
          .sort({ scheduled: 1 })
          .exec(); // Fetch episodes where `userSimulation` is empty, ordered by `scheduledDate`

        if (!episodes.length) {
          this.logger.debug('No more episodes to process. Exiting loop.');
          break;
        }

        for (const episode of episodes) {
          let event: ChatEventDocument;
          const eventName = episode?.eventName;

          // Check if event is already in cache
          if (eventCache.has(eventName)) {
            event = eventCache.get(eventName);
          } else {
            // Fetch from database if not in cache
            event = eventName
              ? await this.chatEventModel.findOne({ name: eventName }).exec()
              : null;

            if (event) {
              eventCache.set(eventName, event);
            }
          }

          let speakers: { name: string; image: string; gender: string }[] = [];

          if (event?.aiCharacters?.length) {
            speakers = event.aiCharacters.map((res) => ({
              name: res?.name,
              image: res?.image,
              gender: res?.gender,
            }));
          }

          let _threadId: string | null = null;
          let fullParsedData: ConvertSimulationType[] = [];
          let isLastData = false;
          let isFirstRequest = true;

          while (!isLastData) {
            const prompt = isFirstRequest
              ? formatSimulationToJson(episode?.simulation, speakers)
              : 'next data';

            const threadMessageInput: ThreadMessageInput = {
              threadId: _threadId,
              message: prompt,
            };

            let parsedChunk: any;

            const { message, threadId } = await retryWithDelay(
              async () =>
                await this.asstThreadService.addMessage(
                  user,
                  threadMessageInput,
                  ComponentType.CHAT_SIMULATION,
                  null,
                  [],
                ),
              5,
              3000,
            );

            if (!isValidJSON(message)) {
              parsedChunk = await this.asstThreadService.getValidateJSON(
                message,
              );
            } else {
              parsedChunk = JSON.parse(message);
            }

            _threadId = threadId || _threadId;
            fullParsedData = [...fullParsedData, ...(parsedChunk?.data || [])];
            isLastData = parsedChunk?.isLastData || false;
            isFirstRequest = false;
          }

          if (fullParsedData) {
            const eventNameTolowercase = episode?.eventName?.toLowerCase();
            const episodeTitleTolowercase =
              episode?.episodeTitle?.toLowerCase();
            const normalizeText = (text: string) =>
              text?.toLowerCase()?.replace(/[-\s]+/g, ' ');

            const isEpisodeTitlePresent = normalizeText(
              fullParsedData[0]?.conversation,
            )?.includes(normalizeText(episodeTitleTolowercase));

            const isEventNamePresent = normalizeText(
              fullParsedData[0]?.conversation,
            )?.includes(normalizeText(eventNameTolowercase));

            if (isEpisodeTitlePresent || isEventNamePresent) {
              fullParsedData.shift();
            }

            episode.userSimulation = fullParsedData;
            episode.status = EpisodeStatus.QUEUED;
            // episode.joinCode = this.uid.rnd();
            await episode.save();
          }
        }
      }
    } catch (error) {
      this.logger.error('Unexpected error occurred:', error);
    }
  }

  // Get word count by simulation duration
  getWordCount(duration: string, wpm = 220): number {
    const parts = duration.split(':').map(Number).reverse();
    const seconds = (parts[0] ?? 0) * 60 + (parts[1] ?? 0) * 3600;
    return Math.round((seconds / 60) * wpm);
  }

  // // Validate episode (Check for duplicate contentTempFileUUID & fileTempFileUUID)
  validateEpisode(episodes: UploadedEpisode[]) {
    const contentUUIDSet = new Set<string>();
    const fileUUIDSet = new Set<string>();

    episodes.forEach((episode: UploadedEpisode) => {
      if (episode?.tempFileUUID && contentUUIDSet.has(episode.tempFileUUID)) {
        throw new BadRequestException(
          `Duplicate contentTempFileUUID found: ${episode.tempFileUUID}`,
        );
      }
      contentUUIDSet.add(episode?.tempFileUUID);

      if (episode?.fileUrl && fileUUIDSet.has(episode.fileUrl)) {
        throw new BadRequestException(
          `Duplicate fileUrl found: ${episode.fileUrl}`,
        );
      }
      if (episode?.fileUrl) {
        fileUUIDSet.add(episode.fileUrl);
      }
    });
  }

  // Convert PDF to Markdown
  async convertPdfToMarkdown(file: FileUpload): Promise<{ markdown: string }> {
    try {
      const { createReadStream, filename } = file;

      const fileExtension = extname(filename).toLowerCase(); // Get file extension

      if (!['.pdf'].includes(fileExtension)) {
        throw new BadRequestException(`Invalid file type: ${filename}`);
      }

      return new Promise((resolve, reject) => {
        // Define the path to the venv Python executable
        const venvPython =
          process.platform === 'win32'
            ? join(process.cwd(), 'venv', 'Scripts', 'python.exe')
            : join(process.cwd(), 'venv', 'bin', 'python');

        // Fallback to system Python if venv Python doesn't exist
        const pythonExecutable = existsSync(venvPython)
          ? venvPython
          : 'python3';

        // Path to your script (always relative to project root)
        const pythonScript = join(process.cwd(), 'scripts', 'pdf_to_md.py');

        // Spawn the Python process
        const python = spawn(pythonExecutable, [pythonScript]);

        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          error += data.toString();
        });

        python.on('close', (code) => {
          if (code !== 0) {
            return reject(`Python script failed with code ${code}: ${error}`);
          }
          resolve({ markdown: output });
        });

        // Pipe the uploaded PDF file stream directly to Python stdin
        const fileStream = createReadStream();
        fileStream.pipe(python.stdin);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Assign voice IDs to the simulation based on character details
  assignVoiceIds(
    simulation: ConvertSimulationType[],
    characterDetails: AICharacterEntityType[],
  ): SimulationOutput[] {
    const _simulation = simulation.filter(
      (sim) => sim.name && sim.name.trim() !== '',
    ); // Filter out empty names

    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/gi, ''); // Helper function to convert name to lowercase, remove special characters and spaces

    // Create a map of normalized names to character details
    const characterDetailsMap = new Map<string, AICharacterEntityType>();
    characterDetails.forEach((character) => {
      if (character?.name) {
        characterDetailsMap.set(normalize(character.name), character);
      }
    });

    const fallbackVoiceMap = new Map<string, string>(); // Fallback map to store assigned voice IDs for names not in characterDetails

    return _simulation.map(({ name, gender, conversation }) => {
      const normalizedName = normalize(name);
      const characterDetail = characterDetailsMap.get(normalizedName);

      let voiceId: string | undefined;

      if (characterDetail?.voiceId) {
        voiceId = characterDetail.voiceId;
      } else if (fallbackVoiceMap.has(normalizedName)) {
        voiceId = fallbackVoiceMap.get(normalizedName);
      } else {
        // Assign a new random voice and remember it
        const isFemale = gender === 'FEMALE';
        const voiceList = isFemale ? femaleVoiceId : maleVoiceId;
        voiceId = voiceList[Math.floor(Math.random() * voiceList.length)];
        fallbackVoiceMap.set(normalizedName, voiceId);
      }

      return {
        name,
        gender,
        conversation,
        voiceId,
      };
    });
  }

  // Get podcast recent episodes within 7 days old
  async getRecentEpisodes(): Promise<ChatEpisodeEntity[]> {
    try {
      const sevenDaysAgo = subDays(new Date(), 7); // 7 days ago

      const episodes = await this.chatEpisodeModel
        .find({
          scheduled: { $gte: sevenDaysAgo },
          status: { $in: [EpisodeStatus.ONGOING, EpisodeStatus.POSTED] },
        })
        .sort({ scheduled: -1 })
        .limit(10)
        .lean()
        .exec();

      return episodes;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get episode by episodeUUIDs
  async getEpisodesByEpisodeUUID(
    episodeUUIDs: string[],
  ): Promise<ChatEpisodeEntity[]> {
    try {
      const episodes = await this.chatEpisodeModel
        .find({ episodeUUID: { $in: episodeUUIDs } })
        .lean();

      return episodes;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  /**
   *
   * Demo Sumulation API for Samuel to simulate and integrate
   */
  async demoTriggerLiveEpisode(episodeUUID: string, scheduledDate: string) {
    try {
      const episode = await this.chatEpisodeModel
        .findOne({ episodeUUID })
        .exec();

      if (!episode) {
        throw new BadRequestException('Episode not fiound!');
      }

      episode.scheduled = new Date(scheduledDate);
      episode.status = EpisodeStatus.QUEUED;
      episode.completedSimulation = [];

      await episode.save();

      return { message: 'Operation successful' };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async assignJoinCodesToEpisodes() {
    try {
      // Step 1: Find all episodes with a null joinCode
      const episodes = await this.chatEpisodeModel
        .find({ joinCode: null })
        .exec();

      if (!episodes.length) {
        console.log('✅ No episodes found with null joinCode.');
        return { data: 'No episodes found with null joinCode.' };
      }

      // Step 2: Update each with a generated joinCode
      const updates = episodes.map((episode) => {
        episode.joinCode = this.uid.rnd();
        return episode.save(); // returns a Promise
      });

      // Step 3: Wait for all saves to complete
      await Promise.all(updates);

      console.log(`✅ Assigned joinCodes to ${episodes.length} episode(s).`);
      return { data: episodes.length };
    } catch (error) {
      console.error('❌ Failed to assign joinCodes:', error.message);
      throw new BadRequestException(error.message);
    }
  }
}
