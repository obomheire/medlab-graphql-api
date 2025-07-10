import { Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bull';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import ShortUniqueId from 'short-unique-id';
import { ThreadMessageInput } from 'src/llm-providers/openAI/dto/assistant.input';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import {
  multichoicePrompt,
  openEndedPrompt,
  pollPrompt,
} from 'src/chat-simulation/constants/engagement.constant';
import {
  formatSimulationToJson,
  simulationPrompt,
} from 'src/chat-simulation/constants/prompt.constant';
import { EpisodeContent } from 'src/chat-simulation/dto/chat-simulation.input';
import {
  ChatEpisodeDocument,
  ChatEpisodeEntity,
} from 'src/chat-simulation/entities/chat-episode-entity';
import { ChatSimulationEntity } from 'src/chat-simulation/entities/chat-simulation-entity';
import {
  EpisodeStatus,
  ScheduleType,
} from 'src/chat-simulation/enums/chat-simuation.enum';
import {
  GroupedChatEpisodes,
  SimulationPoll,
  SimulationQuiz,
} from 'src/chat-simulation/types/chat.types';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/service/user.service';
import { ChatEventEntity } from 'src/chat-simulation/entities/chat-event.entity';
import { eventEmitterType } from 'src/utilities/enum/env.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatSimulationService } from 'src/chat-simulation/service/chat-simulation.service';
import { retryWithDelay } from 'src/utilities/service/helpers.service';
import { QueueProcessorType, QueueProcessType } from '../enum/queue.enum';
import { UserDocument } from 'src/user/entity/user.entity';
import pLimit from 'p-limit';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { ElevenLabsService } from 'src/llm-providers/elevenlabs/service/elevenlabs.service';
import * as mm from 'music-metadata';

@Processor(QueueProcessorType.CHAT_SIMULATION)
export class ChatSimulationProcessor {
  private readonly logger = new Logger(ChatSimulationProcessor.name);
  private readonly uid = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(ChatEpisodeEntity.name)
    private chatEpisodeModel: Model<ChatEpisodeEntity>,
    @InjectModel(ChatEventEntity.name)
    private chatEventModel: Model<ChatEventEntity>,
    @InjectModel(ChatSimulationEntity.name)
    private chatSimulationModel: Model<ChatSimulationEntity>,
    private asstThreadService: AsstThreadService,
    private readonly configService: ConfigService,
    private userService: UserService,
    private eventEmitter: EventEmitter2,
    private chatSimulationService: ChatSimulationService,
    private readonly elevenLabsService: ElevenLabsService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  @Process({ name: QueueProcessType.EPISODE_SCHEDULING }) // Not in use (To be deleted)
  async handleChatSimulation(job: Job) {
    try {
      this.logger.debug('Scheduling job started...!');

      const episodesToConvert = await this.getGroupedEpisodesToConvert();
      this.convertEpisodesToJson(job.data || episodesToConvert);

      // Loop continues until there are no episodes left to process
      while (true) {
        // Dynamically fetch the `scheduled` array from the database
        const scheduled = await this.getGroupedEpisodes();
        // Break the loop if there are no episodes left to process
        if (scheduled?.length === 0) break;

        for (let i = 0; i < scheduled?.length; i++) {
          const episode = scheduled[i];

          // Parse the scheduled time and convert to local time
          const scheduledTimeUTC = new Date(episode?.scheduledDate);
          const localOffset = scheduledTimeUTC.getTimezoneOffset() * 60 * 1000; // Offset in milliseconds
          const scheduledTimeLocal = scheduledTimeUTC.getTime() - localOffset; // Convert UTC to local time

          const episodeUUIDs = episode?.episodes?.map(
            (res) => res?.episodeUUID,
          );
          const gracePeriod = 3000;
          const currentTime = Date.now(); // Server's current local time in milliseconds

          // if (this.isLive(episode?.scheduledDate)) {
          if (scheduledTimeLocal <= currentTime + gracePeriod) {
            await this.chatSimulationService.updateEpisodeStatus(episodeUUIDs);
          }
        }
        // Add a small delay to avoid excessive CPU usage
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.logger.debug('Job completed!!');
    } catch (error) {
      this.logger.debug('Episode Scheduling Job failed!!');
      throw new BadRequestException(error?.message);
    }
  }

  @Process({ name: QueueProcessType.GENERATE_SIMULATION })
  async saveSimulation(job: Job): Promise<void> {
    this.logger.debug('Simulation Job started!!');
    try {
      const ptPayload = job?.data;
      let thread_id = ptPayload?.threadId;
      const eventName = ptPayload?.eventName;
      const scheduled = ptPayload?.scheduled;
      const scheduledType = ptPayload?.scheduledType;

      const proptPayload: any = {};
      // Helper function to add delay
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const result = [];

      // Sort episodeContent by scheduled date

      await Promise.all(
        ptPayload?.episodeContent?.map(async (res: EpisodeContent) => {
          proptPayload.noOfActors = ptPayload?.actorCount;
          proptPayload.noOfPanelist = ptPayload?.noOfPanelist;
          proptPayload.eventDescription = ptPayload?.eventDescription;
          proptPayload.eventName = ptPayload?.eventName;
          proptPayload.eventOutline = ptPayload?.eventOutline;

          proptPayload.category = ptPayload?.category;
          proptPayload.channelDescription = ptPayload?.channelDescription;
          proptPayload.channelName = ptPayload?.channelName;
          proptPayload.episodeTitle = res?.title;
          proptPayload.episodeTopics = res?.topic;
          proptPayload.characterDetails = ptPayload?.characterDetails;
          proptPayload.duration = ptPayload?.duration;

          const threadMessageInput: ThreadMessageInput = {
            threadId: thread_id,
            message: simulationPrompt(proptPayload, ptPayload?.userPrompt),
          };

          const {
            message: content,
            threadId: chatThreadId,
            messageId,
          } = await this.retry(() =>
            this.asstThreadService.addMessage(
              ptPayload?.user,
              threadMessageInput,
              ComponentType.CHAT_SIMULATION,
              null,
              [],
              'chat-simulation-images',
            ),
          );

          const parsedContent = JSON.parse(content)?.simulation;

          let pollResult = [];
          let quizResult = [];

          if (ptPayload?.isQuiz) {
            quizResult = await this.retry(() =>
              this.generateQuiz({
                threadId: thread_id || chatThreadId,
                user: ptPayload?.user,
                topic: res?.topic,
                noOfQuestions: ptPayload?.noOfQuestions,
                episode: res?.episode,
                quizType: ptPayload?.quizType,
              }),
            );
          }

          if (ptPayload?.isPoll) {
            pollResult = await this.retry(() =>
              this.generatePoll({
                threadId: thread_id || chatThreadId,
                user: ptPayload?.user,
                topic: res?.topic,
                noOfQuestions: ptPayload?.noOfQuestions,
                episode: res?.episode,
                pollType: ptPayload?.pollType,
              }),
            );
          }

          const payload = {
            episode: res?.episode,
            noOfEpisodes: ptPayload?.noOfEpisodes,
            episodeTitle: res?.title,
            episodeTopics: res?.topic,
            quiz: quizResult,
            poll: pollResult,
            eventName: ptPayload?.eventName,
            category: ptPayload?.category,
            channelName: ptPayload?.channelName,

            channelDescription: ptPayload?.channelDescription,
            eventDescription: ptPayload?.eventDescription,
            eventOutline: ptPayload?.eventOutline,
            actorCount: ptPayload?.actorCount,
            characterDetails: ptPayload?.characterDetails,
            quizType: ptPayload?.quizType,
            pollType: ptPayload?.pollType,
            noOfQuestions: ptPayload?.noOfQuestions,
            threadId: chatThreadId,
            simulation: parsedContent,
            scheduled: ptPayload?.scheduled,
            scheduledType: ptPayload?.scheduledType,
          };

          result.push(payload);
          thread_id = chatThreadId;
          await delay(100);
        }),
      );

      if (result?.length > 0) {
        await this.chatSimulationModel
          .insertMany(result)
          .catch((error) => {
            console.log(error.message);
          })
          .then(async (res) => {
            await this.updateScheduledDates(
              eventName,
              scheduled,
              scheduledType,
            );
          });
      }
    } catch (error) {
      this.logger.debug('error:: ', error?.message);

      throw new BadRequestException(error?.message);
    }
  }

  // generate podcast queue
  @Process({ name: QueueProcessType.GENERATE_PODCAST })
  async generatePodcastJob({ data }: Job) {
    this.logger.debug('Podcast Generation Job Started!!');

    const simulationUUIDs = data?.simulationUUIDs as string[];
    const user = data?.user as UserDocument;

    if (!simulationUUIDs?.length) {
      this.logger.warn('No simulationUUIDs provided in job data.');
      return;
    }

    try {
      // Fetch all simulations
      const simulations = await this.chatSimulationService.getChatSimulations(
        simulationUUIDs,
      );

      // Map simulations by UUID for easier access
      const simMap = new Map(
        simulations.map((sim) => [sim.simulationUUID, sim]),
      );

      await Promise.all(
        simulationUUIDs.map(async (simulationUUID) => {
          const simulation = simMap.get(simulationUUID);

          try {
            const userSimulation =
              await this.chatSimulationService.convertSimulationToJson(
                simulation,
                user,
              );

            const simWithVoiceIds = this.chatSimulationService.assignVoiceIds(
              userSimulation,
              simulation?.characterDetails,
            );

            const limit = pLimit(5); // Limit concurrency for TTS

            // // Use google text to speech to generate audio for each simulation
            // const audioBuffers = await Promise.all(
            //   simulation.map((sim) => {
            //     const gender = sim?.gender || 'female';
            //     return this.speechAIservice.synthesizeSpeech(
            //       sim.conversation,
            //       gender.toUpperCase() as GenderType,
            //     );
            //   }),
            // );

            // Use elevenlabs to generate audio for each simulation
            const audioBuffers = await Promise.all(
              simWithVoiceIds.map((sim) =>
                limit(() =>
                  retryWithDelay(
                    () =>
                      this.elevenLabsService.createTextToSpeech(
                        sim.conversation,
                        sim.voiceId,
                      ),
                    3,
                    10000,
                  ),
                ),
              ),
            );

            // Validate the audio buffers
            if (
              !Array.isArray(audioBuffers) ||
              audioBuffers.some((b) => !Buffer.isBuffer(b))
            ) {
              this.logger.error(
                'Error generating podcast from elevenlabs',
                audioBuffers,
              );

              return;
            }

            const finalAudio: Buffer = Buffer.concat(audioBuffers);

            // Calculate duration of the audio
            const metadata = await mm.parseBuffer(finalAudio, null, {
              duration: true,
            });

            const duration = Math.round(metadata.format.duration || 0); // Duration of the audio file
            const audioSize = finalAudio.length; // Buffer.length gives size in bytes

            const { secure_url } = await this.awsS3Service.uploadFile(
              'chat-simulation/episode',
              finalAudio,
              '.mp3',
              'audio/mpeg',
            );

            simulation.fileUrl = secure_url;
            simulation.genPodStatus = EpisodeStatus.COMPLETED;
            simulation.userSimulation = userSimulation;
            simulation.duration = duration;
            simulation.audioSize = audioSize;
            await simulation.save();

            this.eventEmitter.emit(
              eventEmitterType.PODCAST_GENERATED,
              user.userUUID,
              {
                fileUrl: secure_url,
                simulationUUID: simulation.simulationUUID,
              },
            );

            this.logger.debug(
              `Podcast generation completed for ${simulationUUID}`,
            );
          } catch (error) {
            this.logger.error(
              `Podcast Generation Failed for ${simulationUUID}:`,
              error,
            );
          }
        }),
      );

      this.logger.debug('Podcast Generation Job Batch Completed!');
    } catch (error) {
      this.logger.error('Podcast Generation Job Batch Failed:', error);
      throw new BadRequestException(error.message);
    }
  }

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

  async getGroupedEpisodes(): Promise<GroupedChatEpisodes[]> {
    const currentDate = new Date();

    const groupedEpisodes = await this.chatEpisodeModel.aggregate([
      {
        $match: {
          scheduled: { $gte: currentDate }, // Exclude past dates
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

  async getGroupedEpisodesToConvert(): Promise<ChatEpisodeDocument[]> {
    const currentDate = new Date();

    const groupedEpisodes = await this.chatEpisodeModel.aggregate([
      {
        $match: {
          scheduled: { $gte: currentDate }, // Exclude past dates
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

    return groupedEpisodes;
  }

  //Method for automaticall assigning date to the episode based on the scheduled type set on the event
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
        const foundSimulation = await this.chatSimulationModel.findOne({
          simulationUUID: record?.simulationUUID,
        });

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

  // Convert simulation to json (To be deleted)
  async convertEpisodesToJson(episodes: ChatEpisodeDocument[]): Promise<void> {
    try {
      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );
      const user = await this.userService.getUserByObjectId(medScrollId);

      if (episodes?.length > 0) {
        for (const episode of episodes) {
          const foundEvent = await this.chatEventModel
            .findOne({ name: episode?.eventName })
            .exec();

          let speakers = [];

          if (foundEvent) {
            speakers = foundEvent?.aiCharacters?.map((res) => ({
              name: res?.name,
              image: res?.image,
              gender: res?.gender,
            }));
          }

          let _threadId: string | null = null;
          let fullParsedData = [];
          let isLastData = false;
          let isFirstRequest = true;

          while (!isLastData) {
            const message = isFirstRequest
              ? formatSimulationToJson(episode?.simulation, speakers)
              : 'next data';

            const threadMessageInput: ThreadMessageInput = {
              threadId: _threadId,
              message,
            };

            const response = await retryWithDelay(
              async () => {
                const { message, threadId } =
                  await this.asstThreadService.addMessage(
                    user,
                    threadMessageInput,
                    ComponentType.SIMULATION_CONVERSION,
                    null,
                    [],
                  );

                if (!message) {
                  throw new Error('Assistant returned empty content.');
                }

                _threadId = threadId || _threadId;
                return message;
              },
              3,
              1000 * 60,
            );

            const parsedChunk = JSON.parse(response);
            fullParsedData = [...fullParsedData, ...(parsedChunk?.data || [])];
            isLastData = parsedChunk?.isLastData || false;
            isFirstRequest = false;
          }

          // Match speaker images
          fullParsedData?.forEach((simulation) => {
            const matchedSpeaker = speakers?.find((speaker) => {
              const normalize = (str: string) =>
                str
                  ?.toLowerCase()
                  .trim()
                  .replace(/\s+/g, ' ')
                  .replace(/\./g, '');
              return normalize(speaker?.name) === normalize(simulation?.name);
            });

            if (matchedSpeaker) {
              simulation.image = matchedSpeaker?.image;
            }
          });

          // Remove first heading if it duplicates the title
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
          }

          episode.userSimulation = fullParsedData;
          episode.joinCode = this.uid.rnd();
          await episode.save();
          episode.isModified('userSimulation');
        }
      }
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Unexpected error occurred.',
      );
    }
  }

  private isLive(dateScheduled: Date): boolean {
    const scheduledDate = new Date(dateScheduled);
    const currentDate = new Date();
    return (
      scheduledDate.getFullYear() === currentDate.getFullYear() &&
      scheduledDate.getMonth() === currentDate.getMonth() &&
      scheduledDate.getDate() === currentDate.getDate() &&
      scheduledDate.getHours() === currentDate.getHours() &&
      scheduledDate.getMinutes() === currentDate.getMinutes()
    );
  }

  //This method is used to retry a function
  async retry<T>(fn: () => Promise<T>, retries = 5, delayMs = 500): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (error) {
        attempt++;
        if (attempt >= retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt)); // Exponential backoff
      }
    }
    throw new BadRequestException('Retries exceeded');
  }
}
