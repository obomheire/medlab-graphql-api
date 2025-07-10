import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ChatUserActivityDocument,
  ChatUserActivityEntity,
} from '../entities/chat-user-activity.entity';
import { Model, PipelineStage } from 'mongoose';
import { ChatEpisodeEntity } from '../entities/chat-episode-entity';
import {
  GetEpisodeSimulationInput,
  VisitedEventEpisodeInput,
} from '../dto/chat-simulation.input';
import { ChatCategoryEntity } from '../entities/chat-category.entity';
import {
  ChannelHomeFeedRes,
  ChannelsEpisodeRes,
  ChatMobileExporeChannelRes,
  GetEpisodeSimulationRes,
  GetMobileChannelEventsRes,
  GetMobileChannelsRes,
  MobileChannelRes,
  MobileChannelsEventsRes,
  NextDiscoveryType,
  SimulationEventDetailsRes,
  UserVisitedChannelsRes,
} from '../types/chat.types';
import { ChatEventEntity } from '../entities/chat-event.entity';
import { ChatChannelEntity } from '../entities/chat-channel.entity';
import { EpisodeStatus } from '../enums/chat-simuation.enum';
import { Pagination } from 'src/quiz/types/quiz.types';
import { getPagination } from 'src/utilities/service/helpers.service';
import { ChatSimulationService } from './chat-simulation.service';

@Injectable()
export class ChatSimulationMobileService {
  private readonly logger = new Logger(ChatSimulationMobileService.name);

  constructor(
    @InjectModel(ChatUserActivityEntity.name)
    private userActivityModel: Model<ChatUserActivityEntity>,
    @InjectModel(ChatEpisodeEntity.name)
    private chatEpisodeModel: Model<ChatEpisodeEntity>,
    @InjectModel(ChatCategoryEntity.name)
    private chatCategoryModel: Model<ChatCategoryEntity>,
    @InjectModel(ChatEventEntity.name)
    private chatEventModel: Model<ChatEventEntity>,
    @InjectModel(ChatChannelEntity.name)
    private chatChannelModel: Model<ChatChannelEntity>,
    private readonly chatSimulationService: ChatSimulationService,
  ) {}

  //Get all categories and channels
  async getChatMobileChannels(
    channelName?: string,
  ): Promise<GetMobileChannelsRes[]> {
    try {
      const categories = await this.chatCategoryModel.find().populate<{
        channels: {
          name: string;
          description: string;
          coverImage: string;
          channelUUID: string;
          events: {
            name: string;
            description: string;
            coverImage: string;
            eventUUID: string;
            episodes: {
              episodeTitle: string;
              episodeUUID: string;
              status: string;
              scheduled: Date;
              episode: string;
            }[];
          }[];
        }[];
      }>({
        path: 'channels',
        model: 'ChatChannelEntity',
        select: 'name description coverImage channelUUID',
        match: channelName
          ? { name: { $regex: `.*${channelName}.*`, $options: 'i' } }
          : undefined,
        populate: {
          path: 'events',
          model: 'ChatEventEntity',
          select: 'name description coverImage eventUUID',
          populate: {
            path: 'episodes',
            model: 'ChatEpisodeEntity',
            select: 'episodeTitle status scheduled episode episodeUUID',
            options: { sort: { episode: 1 } },
          },
        },
      });

      if (!categories) {
        throw new BadRequestException('No channels found');
      }

      const filteredCategories = categories
        .map((category) => {
          const filteredChannels = category.channels
            .map((channel) => {
              // Filter events to only include those with at least one valid non-Queued episode
              const filteredEvents = channel.events
                ?.map((event) => {
                  // 1. Filter out any invalid/non-existent episodes
                  const validEpisodes = event.episodes?.filter(
                    (ep) => ep && typeof ep === 'object' && ep.status,
                  );

                  // 2. Check if there are any episodes at all
                  if (!validEpisodes || validEpisodes.length === 0) {
                    return null;
                  }

                  // 3. Check if ALL episodes are Queued
                  const allQueued = validEpisodes.every(
                    (ep) => ep.status === 'Queued',
                  );

                  if (allQueued) {
                    return null;
                  }

                  return {
                    ...event,
                    episodes: validEpisodes,
                  };
                })
                .filter((event) => event !== null);

              // Exclude channel if it has no events with valid non-Queued episodes
              if (!filteredEvents || filteredEvents.length === 0) {
                return null;
              }

              // Check if any episode is ongoing
              const isOngoingEpisode = filteredEvents.some((event) =>
                event.episodes.some(
                  (ep) => ep.status === EpisodeStatus.ONGOING,
                ),
              );

              return {
                channelName: channel.name,
                channelDescription: channel.description,
                channelCoverImage: channel.coverImage,
                channelUUID: channel.channelUUID,
                onGoingEpisode: isOngoingEpisode,
              };
            })
            .filter((channel) => channel !== null);

          // Exclude category if it has no valid channels
          if (!filteredChannels || filteredChannels.length === 0) {
            return null;
          }

          return {
            category: category.name,
            channels: filteredChannels,
          };
        })
        .filter((cat) => cat !== null);

      return filteredCategories;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Get all channel events
  async getChatMobileChannelEvents(
    channelName: string,
    eventName?: string,
    userUUID?: string, // this is only use for saving the activity of the user when he/she calls this endpoint
  ): Promise<GetMobileChannelEventsRes> {
    try {
      const channel = await this.chatChannelModel
        .findOne({ name: { $regex: channelName, $options: 'i' } })
        .select('name description coverImage')
        .populate<{
          events: {
            name: string;
            description: string;
            eventUUID: string;
            coverImage: string;
            episodes: {
              episodeTitle: string;
              episodeUUID: string;
              status: string;
              scheduled: Date;
              episode: string;
            }[];
          }[];
        }>({
          path: 'events',
          model: 'ChatEventEntity',
          select: 'name description coverImage eventUUID',
          match: eventName
            ? { name: { $regex: `.*${eventName}.*`, $options: 'i' } }
            : undefined, // Substring, case-insensitive match
          //We are populating the must current episodes for each event
          populate: {
            path: 'episodes',
            model: 'ChatEpisodeEntity',
            select: 'episodeTitle status scheduled episode episodeUUID',
            options: { sort: { episode: 1 } },
          },
        });

      if (!channel) {
        throw new BadRequestException(
          `Channel with the name ${channelName} was not found`,
        );
      }

      if (userUUID) {
        console.log('saveUserVisitedChannel was called');
        await this.saveUserVisitedChannel(channelName, userUUID);
      }

      return {
        channelName: channel?.name,
        channelDescription: channel?.description,
        channelCoverImage: channel?.coverImage,
        events: channel?.events?.map((event) => {
          let isOngoingEpisode = false;
          event?.episodes?.forEach((episode) => {
            if (episode.status === EpisodeStatus.ONGOING) {
              isOngoingEpisode = true;
            }
          });

          return {
            name: event?.name,
            description: event?.description,
            coverImage: event?.coverImage,
            eventUUID: event?.eventUUID,
            onGoingEpisode: isOngoingEpisode,
            eventCurrentEpisode: {
              title: event?.episodes[0]?.episodeTitle,
              episode: event?.episodes[0]?.episode,
              episodeUUID: event?.episodes[0]?.episodeUUID,
              status: event?.episodes[0]?.status,
              publishedDate: event?.episodes[0]?.scheduled,
            },
          };
        }),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getChatMobileEventEpisodes(
    eventName: string,
    episode?: string,
    userUUID?: string, // this is only use for saving the activity of the user when he/she calls this endpoint
    page?: number,
    limit?: number,
  ): Promise<ChannelsEpisodeRes> {
    try {
      if (!eventName) return;
      const pageSize = Math.max(limit, 1);
      const currentPage = Math.max(page, 1);

      const skip = (currentPage - 1) * pageSize;

      const matchFilter: any = {
        status: { $in: [EpisodeStatus.ONGOING, EpisodeStatus.POSTED] },
      };
      if (episode) matchFilter.episode = episode;

      const event = await this.chatEventModel
        .findOne({ name: eventName })
        .populate<{
          name: string;
          description: string;
          coverImage: string;
          eventUUID: string;
          channelName: string;
          episodes: {
            episodeTitle: string;
            episodeTopics: string[];
            episodeUUID: string;
            status: string;
            scheduled: Date;
            episode: string;
            joinCode: string;
            fileUrl: string;
          }[];
        }>({
          path: 'episodes',
          model: 'ChatEpisodeEntity',
          select:
            'episodeTitle episodeTopics status scheduled episode episodeUUID joinCode fileUrl',
          match: matchFilter,
          options: {
            sort: { episode: 1 },
            skip,
            limit: pageSize,
          },
        });

      const totalEventEpisodes = await this.chatEventModel
        .findOne({ name: eventName })
        .populate<{
          episodes: {
            episodeTitle: string;
            episodeTopics: string[];
            episodeUUID: string;
            status: string;
            scheduled: Date;
            episode: string;
            joinCode: string;
            fileUrl: string;
          }[];
        }>({
          path: 'episodes',
          model: 'ChatEpisodeEntity',
          select:
            'episodeTitle episodeTopics status scheduled episode episodeUUID joinCode fileUrl',
          match: matchFilter,
        });

      if (!event) {
        throw new BadRequestException('Event not found');
      }

      const totalPages = Math.ceil(
        totalEventEpisodes?.episodes?.length / pageSize,
      );

      if (userUUID) {
        await this.saveUserVisitedEvent(eventName, userUUID);
      }

      const pagination = {
        totalRecords: totalEventEpisodes?.episodes?.length || 0,
        totalPages,
        pageSize: event?.episodes?.length,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        currentPage,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
      };

      const episodeData = event?.episodes.map((episode) => {
        return {
          eventName: event?.name,
          eventDescription: event?.description,
          eventCoverImage: event?.coverImage,
          eventUUID: event?.eventUUID,
          channelName: event?.channelName,
          episode: episode?.episode,
          episodeTitle: episode?.episodeTitle,
          episodeUUID: episode?.episodeUUID,
          scheduled: episode?.scheduled,
          status: episode?.status,
          joinCode: episode?.joinCode,
          fileUrl: episode?.fileUrl,
        };
      });

      return { episodes: episodeData, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Section for capturing user visited events Episode
  async saveUserVisitedEventEpisode(
    visitedEventEpisodeInput: VisitedEventEpisodeInput,
    userUUID: string,
  ): Promise<void> {
    try {
      const { eventName, visitedEpisode } = visitedEventEpisodeInput;
      const foundUserActivity = await this.userActivityModel.findOne({
        userUUID,
      });

      const visitedPayload = {
        eventName,
        visitedEpisode,
        visitedDate: new Date(),
      };

      if (!foundUserActivity) {
        const newUserActivity = new this.userActivityModel({
          userUUID,
          visitedEventsEpisode: [visitedPayload],
        });
        await newUserActivity.save();
      } else {
        const foundExistingEvent = foundUserActivity.visitedEventsEpisode.find(
          (event) => event.eventName.toLowerCase() === eventName.toLowerCase(),
        );

        if (foundExistingEvent) {
          await this.userActivityModel.findOneAndUpdate(
            {
              userUUID,
              'visitedEventsEpisode.eventName': eventName, // Find event inside array
            },
            {
              $set: {
                'visitedEventsEpisode.$.visitedEpisode': visitedEpisode, // Correct path
                'visitedEventsEpisode.$.visitedDate': new Date(), // Correct path
              },
            },
          );
        } else {
          await this.userActivityModel.updateOne(
            { userUUID },
            { $push: { visitedEventsEpisode: visitedPayload } },
          );
        }
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  // Section for capturing user visited events
  async saveUserVisitedEvent(
    eventName: string,
    userUUID?: string,
  ): Promise<void> {
    try {
      const foundUserActivity = await this.userActivityModel.findOne({
        userUUID,
      });

      const visitedPayload = {
        eventName,
        visitedDate: new Date(),
      };

      if (!foundUserActivity) {
        const newUserActivity = new this.userActivityModel({
          userUUID,
          visitedEvents: [visitedPayload],
        });
        await newUserActivity.save();
      } else {
        const foundExistingEvent = foundUserActivity.visitedEventsEpisode.find(
          (event) => event.eventName.toLowerCase() === eventName.toLowerCase(),
        );

        if (foundExistingEvent) {
          await this.userActivityModel.findOneAndUpdate(
            {
              userUUID,
              'visitedEvents.eventName': eventName, // Find event inside array
            },
            {
              $set: {
                'visitedEvents.$.visitedDate': new Date(), // Correct path
              },
            },
          );
        } else {
          await this.userActivityModel.updateOne(
            { userUUID },
            { $push: { visitedEvents: visitedPayload } },
          );
        }
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  // Section for capturing user visited channels
  async saveUserVisitedChannel(
    channelName: string,
    userUUID?: string,
  ): Promise<void> {
    try {
      const foundUserActivity = await this.userActivityModel.findOne({
        userUUID,
      });

      const visitedPayload = {
        channelName,
        visitedDate: new Date(),
      };

      if (!foundUserActivity) {
        const newUserActivity = new this.userActivityModel({
          userUUID,
          visitedChannels: [visitedPayload],
        });
        await newUserActivity.save();
      } else {
        const foundExistingEvent = foundUserActivity.visitedChannels.find(
          (event) =>
            event.channelName.toLowerCase() === channelName.toLowerCase(),
        );

        if (foundExistingEvent) {
          await this.userActivityModel.findOneAndUpdate(
            {
              userUUID,
              'visitedChannels.channelName': channelName, // Find event inside array
            },
            {
              $set: {
                'visitedChannels.$.channelName': channelName, // Correct path
                'visitedChannels.$.visitedDate': new Date(), // Correct path
              },
            },
          );
        } else {
          await this.userActivityModel.updateOne(
            { userUUID },
            { $push: { visitedChannels: visitedPayload } },
          );
        }
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  // Section for saving user following channels
  async saveUserFollowedChannel(
    channelName: string,
    userUUID?: string,
  ): Promise<string> {
    try {
      const foundUserActivity = await this.userActivityModel.findOne({
        userUUID,
      });

      if (!foundUserActivity) {
        // If user activity doesn't exist, create new record with followed channel
        const newUserActivity = new this.userActivityModel({
          userUUID,
          channelsFollowed: [{ channelName, followedDate: new Date() }],
        });
        await newUserActivity.save();
        return `You are now following ${channelName} channel`;
      } else {
        const foundExistingChannelIndex =
          foundUserActivity.channelsFollowed.findIndex(
            (channel) =>
              channel?.channelName?.toLowerCase() ===
              channelName?.toLowerCase(),
          );

        if (foundExistingChannelIndex !== -1) {
          // If channel exists, remove it from the array
          await this.userActivityModel.updateOne(
            { userUUID },
            { $pull: { channelsFollowed: { channelName } } },
          );
          return `You have unfollowed ${channelName} channel`;
        } else {
          // If channel does not exist, add it to the array
          await this.userActivityModel.updateOne(
            { userUUID },
            {
              $push: {
                channelsFollowed: { channelName, followedDate: new Date() },
              },
            },
          );
          return `You are now following ${channelName} channel`;
        }
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Section for getting user visited channels
  async getUserVisitedChannels(
    userUUID?: string,
  ): Promise<UserVisitedChannelsRes[]> {
    try {
      const result = await this.userActivityModel.aggregate([
        { $match: { userUUID } },
        { $unwind: '$visitedChannels' }, // Unwind the visitedChannels array
        {
          $group: {
            _id: {
              $dateFromString: {
                dateString: {
                  $dateToString: {
                    format: '%Y-%m-%dT00:00:00.000Z',
                    date: '$visitedChannels.visitedDate',
                  },
                },
              },
            }, // Convert to a proper Date object
            channels: { $addToSet: '$visitedChannels.channelName' }, // Collect unique channel names
          },
        },
        { $project: { _id: 0, visitedDate: '$_id', channels: 1 } }, // Rename fields
        { $sort: { visitedDate: -1 } }, // Sort by most recent date first
      ]);
      return result;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Section for getting epside simulation
  async getEpisodeSimulation(
    payload: GetEpisodeSimulationInput,
    userUUID?: string, // this is only use for saving the activity of the user when he/she navigates to the simulation page
  ): Promise<GetEpisodeSimulationRes> {
    try {
      const { episodeUUID, episodeTitle, channelName, eventName } = payload;
      const episode = await this.chatEpisodeModel
        .findOne({
          episodeUUID,
          eventName: { $regex: eventName, $options: 'i' },
          status: { $in: [EpisodeStatus.ONGOING, EpisodeStatus.POSTED] },
        })
        .select('episode userSimulation status');
      if (!episode) {
        throw new BadRequestException('No simulation found for this episode');
      }

      /*This method helps to remove the channel and episode title from the conversation before being sent to the user*/
      const channelNameTolowercase = channelName?.toLowerCase();
      const episodeTitleTolowercase = episodeTitle?.toLowerCase();
      const normalizeText = (text: string) =>
        text.toLowerCase().replace(/[-\s]+/g, ' ');

      const isEpisodeTitlePresent = normalizeText(
        episode?.userSimulation[0]?.conversation,
      ).includes(normalizeText(episodeTitleTolowercase));
      const isChannelNamePresent = normalizeText(
        episode.userSimulation[0]?.conversation,
      ).includes(normalizeText(channelNameTolowercase));

      if (isEpisodeTitlePresent || isChannelNamePresent) {
        episode?.userSimulation.shift();
      }
      /**Ends here */

      const visitedEventEpisodeInput: VisitedEventEpisodeInput = {
        eventName: eventName,
        visitedEpisode: episode?.episode,
      };

      await this.saveUserVisitedEventEpisode(
        visitedEventEpisodeInput,
        userUUID,
      );

      return {
        userSimulation: episode?.userSimulation,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Section for fetching home feed
  async getChannelHomeFeed(userUUID?: string): Promise<ChannelHomeFeedRes> {
    try {
      // Fetch live episodes
      const liveEpisode = await this.getEpisodesFromChannelsRecord(null, [
        EpisodeStatus.ONGOING,
      ]);

      /*Fetches random category and channels*/
      const randomCategory = await this.chatCategoryModel.aggregate([
        {
          $lookup: {
            from: 'chatchannelentities',
            localField: 'channels',
            foreignField: '_id',
            as: 'channels',
          },
        },
        {
          $unwind: {
            path: '$channels',
            preserveNullAndEmptyArrays: false, // Exclude categories with no channels
          },
        },
        {
          $lookup: {
            from: 'chatevententities',
            localField: 'channels.events',
            foreignField: '_id',
            as: 'channels.events',
          },
        },
        {
          $unwind: {
            path: '$channels.events',
            preserveNullAndEmptyArrays: false, // Exclude channels with no events
          },
        },
        {
          $lookup: {
            from: 'chatepisodeentities',
            localField: 'channels.events.episodes',
            foreignField: '_id',
            as: 'channels.events.episodes',
          },
        },
        {
          $match: {
            channels: { $ne: [] }, // Ensure categories have at least one channel
            // 'channels.events': { $ne: [] }, // Ensure channels have at least one event
            // 'channels.events.episodes': { $ne: [] }, // Ensure events have at least one episode
          },
        },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            categoryUUID: { $first: '$categoryUUID' },
            channels: {
              $push: {
                channelUUID: '$channels.channelUUID',
                channelName: '$channels.name',
                channelCoverImage: '$channels.coverImage',
                channelDescription: '$channels.description',
                events: [
                  {
                    eventUUID: '$channels.events.eventUUID',
                    eventName: '$channels.events.name',
                    eventDescription: '$channels.events.description',
                    eventCoverImage: '$channels.events.coverImage',
                    episodes: '$channels.events.episodes',
                  },
                ],
              },
            },
          },
        },
        {
          $match: {
            'channels.0': { $exists: true },
          },
        },
        {
          $addFields: {
            channels: { $slice: ['$channels', 3] },
          },
        },
        { $sample: { size: 1 } },
      ]);

      //from the channels fetched, this section checks for any event with live episodes and update the status on the returned object
      const randomCatResult = randomCategory?.map((category) => {
        return {
          categoryName: category.name,
          channels: category?.channels?.map((channel) => {
            if (channel?.events?.length > 0) {
              let isOngoingEpisode = false;
              channel?.events?.forEach((event) => {
                event?.episodes?.forEach((episode) => {
                  if (episode.status === EpisodeStatus.ONGOING) {
                    isOngoingEpisode = true;
                  }
                });
              });
              return {
                channelName: channel?.channelName,
                channelUUID: channel?.channelUUID,
                channelCoverImage: channel?.channelCoverImage,
                channelDescription: channel?.channelDescription,
                isLive: isOngoingEpisode,
              };
            }
          }),
        };
      });
      /**Random category ends here */

      /*this section checks for recent episodes released that are not more than 7 days old*/
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const getRecent = await this.getEpisodesFromChannelsRecord(sevenDaysAgo, [
        EpisodeStatus.ONGOING,
        EpisodeStatus.POSTED,
      ]);
      /*Recent Ends here*/

      /**This section gets frequently visited epiosde or visited episodes, so we could give suggestions to the user */
      //first gets the episodes user visited

      let suggestedEpisodes;
      let getFrequentVisitedEpisode: ChatUserActivityDocument[];

      if (userUUID) {
        getFrequentVisitedEpisode = await this.userActivityModel
          .find({ userUUID })
          .exec();
      }

      if (getFrequentVisitedEpisode?.length > 0) {
        const getEpisode = getFrequentVisitedEpisode.flatMap((episodes) => {
          return episodes?.visitedEventsEpisode.flatMap(
            (visited) => visited.eventName,
          );
        });

        //use the eventName to search the event model to find channel they belong to
        const foundEvent = await this.chatEventModel
          .find({ name: { $in: getEpisode } })
          .select('channelName');
        const flatEvent = foundEvent.flatMap((event) => event.channelName);

        //here we use the channel name to search the channel models so we can get other events belonging to the channel
        suggestedEpisodes = await this.getSuggestedEpisode(flatEvent);
      } else {
        suggestedEpisodes = await this.getSuggestedEpisode([]);
        /**Suggestion Ends here */
      }

      /**Next Discovery section */
      const getNextDiscovery = await this.nextEventDiscovery(false);
      /**End of next discovery */

      const response = {
        liveEpisode: liveEpisode,
        category: randomCatResult[0],
        recent: getRecent,
        suggested: suggestedEpisodes,
        next_discovery: getNextDiscovery,
      };

      return response;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Method to get random events
  async nextEventDiscovery(fetchAll = false): Promise<NextDiscoveryType[]> {
    try {
      const pipeline = [];

      // If fetchAll is false, apply the $sample operator to fetch random events
      if (!fetchAll) {
        pipeline.push({ $sample: { size: 10 } });
      }

      pipeline.push(
        {
          $lookup: {
            from: 'chatepisodeentities',
            localField: 'episodes',
            foreignField: '_id',
            as: 'episodes',
          },
        },
        {
          $match: {
            episodes: { $ne: [] }, // Ensures episodes array is not empty
          },
        },
        {
          $addFields: {
            isLive: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: '$episodes',
                          as: 'episode',
                          cond: { $eq: ['$$episode.status', 'Ongoing'] }, // Check if episode status is "Ongoing"
                        },
                      },
                    },
                    0,
                  ],
                },
                then: true,
                else: false,
              },
            },
          },
        },
      );

      pipeline.push({
        $project: {
          name: 1,
          eventUUID: 1,
          description: 1,
          channelName: 1,
          coverImage: 1,
          episodes: 1,
          isLive: 1,
        },
      });

      // Execute the aggregation query
      const randomEvents = await this.chatEventModel.aggregate(pipeline);

      // Map the result to the desired format
      return randomEvents?.map((event) => {
        return {
          channelName: event?.channelName,
          eventName: event?.name,
          eventCoverImage: event?.coverImage,
          eventDescription: event?.description,
          eventUUID: event?.eventUUID,
          isLive: event?.isLive,
        };
      });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getSuggestedEpisode(channels: string[]) {
    try {
      let query;
      if (channels?.length > 0) {
        query = {
          name: { $in: channels },
        };
      } else {
        query = {};
      }
      const foundChannels = await this.chatChannelModel
        .find(query)
        .select('name channelUUID')
        .populate<{
          events: {
            name: string;
            description: string;
            eventUUID: string;
            coverImage: string;
            episodes: {
              episodeTitle: string;
              episodeUUID: string;
              status: string;
              scheduled: Date;
              episode: string;
              joinCode: string;
              fileUrl: string;
            }[];
          }[];
        }>({
          path: 'events',
          model: 'ChatEventEntity',
          select: 'name description coverImage eventUUID',
          //We are populating the must current episodes for each event
          populate: {
            path: 'episodes',
            model: 'ChatEpisodeEntity',
            select:
              'episodeTitle status scheduled episode episodeUUID joinCode fileUrl',
            match: {
              status: { $in: [EpisodeStatus.ONGOING, EpisodeStatus.POSTED] },
            },
          },
        });
      //Here we get all the episodes under that channel
      foundChannels.forEach((channel) => {
        channel.events?.forEach((event) => {
          event.episodes = event.episodes?.slice(0, 10);
        });
      });

      const flatEpisode = foundChannels.flatMap((channel) => {
        return channel?.events?.flatMap((event) => {
          return event?.episodes?.flatMap((episode) => {
            return {
              channelName: channel?.name,
              channelUUID: channel?.channelUUID,
              eventName: event?.name,
              eventDescription: event?.description,
              eventCoverImage: event?.coverImage,
              eventUUID: event?.eventUUID,
              episode: episode?.episode,
              status: episode?.status,
              scheduled: episode?.scheduled,
              episodeUUID: episode?.episodeUUID,
              episodeTitle: episode?.episodeTitle,
              joinCode: episode?.joinCode,
              fileUrl: episode?.fileUrl,
            };
          });
        });
      });
      return flatEpisode;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getEpisodesFromChannelsRecord(
    scheduledDate?: Date,
    statusFilter: string[] = [], // default to empty array
  ) {
    try {
      const episodeMatch: any = {};

      if (statusFilter.length) {
        episodeMatch.status = { $in: statusFilter };
      }

      if (scheduledDate) {
        episodeMatch.scheduled = { $gte: scheduledDate };
      }

      const getRecent = await this.chatChannelModel
        .find({ events: { $exists: true, $not: { $size: 0 } } })
        .select('name channelUUID coverImage description')
        .populate<{
          events: {
            name: string;
            description: string;
            coverImage: string;
            eventUUID: string;
            episodes: {
              episode: string;
              status: string;
              episodeUUID: string;
              scheduled: Date;
              episodeTitle: string;
              joinCode: string;
              fileUrl: string;
            }[];
          }[];
        }>({
          path: 'events',
          model: 'ChatEventEntity',
          select: 'name description eventUUID coverImage episodes',
          match: {
            episodes: { $exists: true, $ne: [], $not: { $size: 0 } }, // Ensure episodes is not empty
          },
          populate: {
            path: 'episodes',
            model: 'ChatEpisodeEntity',
            select:
              'episode status episodeUUID scheduled episodeTitle joinCode fileUrl',
            match:
              Object.keys(episodeMatch).length > 0 ? episodeMatch : undefined,
          },
        })
        .exec();

      const flatRecent = getRecent?.flatMap((recent) => {
        if (recent?.events) {
          return recent?.events?.flatMap((event) => {
            if (event?.episodes) {
              return event?.episodes?.map((episode) => {
                return {
                  channelName: recent?.name,
                  channelUUID: recent?.channelUUID,
                  eventName: event?.name,
                  eventCoverImage: event?.coverImage,
                  eventDescription: event?.description,
                  eventUUID: event?.eventUUID,
                  episode: episode?.episode,
                  episodeTitle: episode?.episodeTitle,
                  status: episode?.status,
                  episodeUUID: episode?.episodeUUID,
                  scheduled: episode?.scheduled,
                  joinCode: episode?.joinCode,
                  fileUrl: episode?.fileUrl,
                };
              });
            }
          });
        }
      });

      return flatRecent;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getMobileChannel_v2(
    channelName: string,
    userUUID?: string,
  ): Promise<MobileChannelRes> {
    try {
      const foundChannel = await this.chatChannelModel.findOne({
        name: { $regex: channelName, $options: 'i' },
      });

      if (!foundChannel) {
        throw new BadRequestException('No channel found!');
      }

      let checkIfFollowed = false;

      if (userUUID) {
        checkIfFollowed = await this.getIsChannelFollowed(
          userUUID,
          channelName,
        );
      }

      return {
        channelCoverImage: foundChannel?.coverImage,
        channelDescription: foundChannel?.description,
        channelName: foundChannel?.name,
        channelUUID: foundChannel?.channelUUID,
        categoryName: foundChannel?.categoryName,
        isFollowed: checkIfFollowed,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //This section is the recent design api

  async getIsChannelFollowed(
    userUUID: string,
    channelName: string,
  ): Promise<boolean> {
    const userActivity = await this.userActivityModel.findOne({
      userUUID,
      channelsFollowed: { $elemMatch: { channelName } },
    });

    return !!userActivity; // Returns true if found, false otherwise
  }

  async getMobileChannelEpisodes_v2(
    channelName: string,
    page?: number,
    limit?: number,
  ): Promise<ChannelsEpisodeRes> {
    try {
      // Ensure valid limit and page numbers
      const pageSize = Math.max(limit, 1);
      const currentPage = Math.max(page, 1);

      const skip = (currentPage - 1) * pageSize;

      // First, count the total episodes (for pagination metadata)
      const totalEpisodes = await this.chatEventModel.aggregate([
        { $match: { channelName: { $regex: channelName, $options: 'i' } } },
        { $unwind: '$episodes' },
        {
          $lookup: {
            from: 'chatepisodeentities',
            localField: 'episodes',
            foreignField: '_id',
            as: 'episodeDetails',
          },
        },
        { $unwind: '$episodeDetails' },
        {
          $match: {
            'episodeDetails.status': {
              $in: [
                EpisodeStatus.ONGOING,
                EpisodeStatus.POSTED,
                // EpisodeStatus.QUEUED,
              ],
            },
          },
        },
        { $count: 'total' },
      ]);

      const totalPages = Math.ceil(totalEpisodes[0]?.total / pageSize) || 0;

      // Fetch paginated results
      const eventsWithEpisodes = await this.chatEventModel
        .find({ channelName: { $regex: channelName, $options: 'i' } })
        .populate<{
          episodes: {
            episode: string;
            status: string;
            scheduled: Date;
            episodeTitle: string;
            episodeUUID: string;
            eventName: string;
            joinCode: string;
            fileUrl: string;
          }[];
        }>({
          path: 'episodes',
          model: 'ChatEpisodeEntity',
          select:
            'eventName episode scheduled status joinCode episodeTitle episodeUUID fileUrl',
          match: {
            status: {
              $in: [
                EpisodeStatus.ONGOING,
                EpisodeStatus.POSTED,
                // EpisodeStatus.QUEUED,
              ],
            },
          },
          options: {
            skip,
            limit: pageSize,
          },
        });

      if (!eventsWithEpisodes.length) {
        throw new BadRequestException('No channel found!');
      }

      // Flatten and format the paginated episodes
      const formattedEpisodes = eventsWithEpisodes.flatMap((event) =>
        event?.episodes?.map((episode) => ({
          channelName: event?.channelName,
          eventName: event?.name,
          eventUUID: event?.eventUUID,
          eventDescription: event?.description,
          eventCoverImage: event?.coverImage,
          episode: episode?.episode,
          episodeTitle: episode?.episodeTitle,
          status: episode?.status,
          scheduled: episode?.scheduled,
          episodeUUID: episode?.episodeUUID,
          joinCode: episode?.joinCode,
          fileUrl: episode?.fileUrl,
        })),
      );

      const pagination = {
        totalRecords: totalEpisodes[0]?.total || 0,
        totalPages,
        pageSize: formattedEpisodes?.length,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        currentPage,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
      };

      return { episodes: formattedEpisodes, pagination };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getMobileChannelEvents_v2(
    channelName: string,
    page = 1,
    limit = 10,
  ): Promise<MobileChannelsEventsRes> {
    try {
      const foundEvent = await this.chatEventModel
        .find({ channelName: { $regex: channelName, $options: 'i' } })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      if (!foundEvent) {
        throw new BadRequestException('No Event found!');
      }

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.chatEventModel,
        { channelName: { $regex: channelName, $options: 'i' } },
        foundEvent,
        limit,
        page,
      );

      const formatResult = foundEvent.flatMap((event) => {
        return {
          channelName: event?.channelName,
          eventName: event?.name,
          eventUUID: event?.eventUUID,
          eventDescription: event?.description,
          eventCoverImage: event?.coverImage,
        };
      });

      return {
        events: formatResult,
        pagination: pagination,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for fetching simulation other details
  async getSimulationsDetails(
    eventName: string,
  ): Promise<SimulationEventDetailsRes> {
    try {
      const foundEvent = await this.chatEventModel
        .findOne({ name: { $regex: eventName, $options: 'i' } })
        .select(
          'name description coverImage eventUUID aiCharacters channelName',
        )
        .populate<{
          episodes: {
            eventName: string;
            episode: string;
            scheduled: Date;
            status: string;
            episodeTitle: string;
            episodeUUID: string;
            joinCode: string;
            fileUrl: string;
          }[];
        }>({
          path: 'episodes',
          model: 'ChatEpisodeEntity',
          select:
            'eventName episode scheduled status episodeTitle episodeUUID joinCode fileUrl',
          match: {
            status: { $in: [EpisodeStatus?.ONGOING, EpisodeStatus.POSTED] },
          },
        });

      return {
        eventDetails: {
          channelName: foundEvent?.channelName,
          eventName: foundEvent?.name,
          eventDescription: foundEvent?.description,
          eventCoverImage: foundEvent?.coverImage,
          eventUUID: foundEvent?.eventUUID,
        },
        hosts: foundEvent?.aiCharacters,
        upNext: foundEvent?.episodes.map((episode) => {
          return {
            eventName: foundEvent?.name,
            eventCoverImage: foundEvent?.coverImage,
            eventDescription: foundEvent?.description,
            episode: episode?.episode,
            episodeTitle: episode?.episodeTitle,
            status: episode?.status,
            scheduled: episode?.scheduled,
            episodeUUID: episode?.episodeUUID,
            joinCode: episode?.joinCode,
            fileUrl: episode?.fileUrl,
          };
        }),
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get the channels for the explore page
  async getExporeChannels(
    channelName?: string,
  ): Promise<ChatMobileExporeChannelRes[]> {
    try {
      const pipeline: PipelineStage[] = [
        // Stage 1: Match channels by name if filter exists
        ...(channelName
          ? [
              {
                $match: {
                  name: { $regex: channelName, $options: 'i' },
                },
              },
            ]
          : []),

        // Stage 2: Lookup events for each channel
        {
          $lookup: {
            from: 'chatevententities',
            localField: 'events',
            foreignField: '_id',
            as: 'events',
          },
        },

        // Stage 3: Lookup episodes for each event
        {
          $lookup: {
            from: 'chatepisodeentities',
            localField: 'events.episodes',
            foreignField: '_id',
            as: 'eventsWithEpisodes',
          },
        },

        // Stage 4: Filter channels with valid events and episodes
        {
          $addFields: {
            validEvents: {
              $filter: {
                input: '$events',
                as: 'event',
                cond: {
                  $let: {
                    vars: {
                      eventEpisodes: {
                        $filter: {
                          input: '$eventsWithEpisodes',
                          as: 'episode',
                          cond: { $in: ['$$episode._id', '$$event.episodes'] },
                        },
                      },
                    },
                    in: {
                      $and: [
                        { $gt: [{ $size: '$$eventEpisodes' }, 0] },
                        {
                          $anyElementTrue: {
                            $map: {
                              input: '$$eventEpisodes',
                              as: 'ep',
                              in: {
                                $in: [
                                  '$$ep.status',
                                  [EpisodeStatus.ONGOING, EpisodeStatus.POSTED],
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },

        // Stage 5: Only include channels with valid events
        {
          $match: {
            'validEvents.0': { $exists: true },
          },
        },

        // Stage 6: Limit if no channel name filter
        ...(!channelName ? [{ $limit: 4 }] : []),

        // Stage 7: Project only needed fields
        {
          $project: {
            name: 1,
            description: 1,
            coverImage: 1,
          },
        },
      ];

      const filteredChannels = await this.chatChannelModel.aggregate(pipeline);

      return filteredChannels;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
}
