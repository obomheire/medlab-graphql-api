import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { ChatSimulationService } from './chat-simulation.service';
import { ChatCategoryEntity } from '../entities/chat-category.entity';
import { Pagination } from 'src/quiz/types/quiz.types';
import { PodcastHomeFeedRes } from '../types/chat.types';
import { CacheService } from 'src/cache/cache.service';
import { Interval } from '@nestjs/schedule';
import { PodcastProgressEntity } from '../entities/podcast-progress.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PodcastProgressInput } from 'src/ws/dto/ws.dto';
import {
  formatDuration,
  getPagination,
} from 'src/utilities/service/helpers.service';
import { ChatEpisodeEntity } from '../entities/chat-episode-entity';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PodcastService {
  private readonly logger = new Logger(PodcastService.name);
  private readonly xmlBuilder: XMLBuilder;

  constructor(
    private readonly awsS3Service: AwsS3Service,
    private readonly chatSimulationService: ChatSimulationService,
    private readonly cacheService: CacheService,
    @InjectModel(PodcastProgressEntity.name)
    private readonly podcastProgressModel: Model<PodcastProgressEntity>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true,
      processEntities: true,
      attributeNamePrefix: '@_',
    });
  }

  // Get audio stream from s3
  async streamPodcast(episodeUUID: string) {
    try {
      const episode = await this.chatSimulationService.getEpisodeById(
        episodeUUID,
      );

      if (!episode?.fileUrl) {
        throw new BadRequestException(
          'File URL does not exist for this episode',
        );
      }

      return await this.awsS3Service.streamPodcast(episode.fileUrl);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get podcast home feed
  async getPodcastHomeFeed(userUUID?: string): Promise<PodcastHomeFeedRes> {
    try {
      const recentEpisodes =
        await this.chatSimulationService.getRecentEpisodes(); // get recent episodes within 7 days old

      let _episodes = [];

      if (userUUID) {
        const { episodes } = await this.getContinueListening(userUUID); // get continue listening episodes for the user

        _episodes = episodes;
      }

      const categories =
        await this.chatSimulationService.getRandomChatCategories(); // get random chat categories

      return {
        recentEpisodes,
        continueListening: _episodes,
        categories,
      };
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
      return await this.chatSimulationService.getPodcastChatCategories(
        page,
        limit,
      );
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getContinueListening(
    userUUID: string,
    page = 1,
    limit = 10,
  ): Promise<{
    episodes: (ChatEpisodeEntity & { progress: number })[];
    pagination: Pagination;
  }> {
    try {
      await this.syncProgressToDbForUser(userUUID); // Sync Redis → DB

      const skip = (page - 1) * limit;
      const query = { userUUID, isCompleted: false }; // Exclude completed episodes

      // Step 1: Fetch episodeUUID and progress
      const progressRecords = await this.podcastProgressModel
        .find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('episodeUUID progress') // Include both episodeUUID and progress
        .lean();

      if (!progressRecords.length) return { episodes: [], pagination: null };

      // Get pagination info
      const pagination: Pagination = await getPagination(
        this.podcastProgressModel,
        query,
        progressRecords,
        limit,
        page,
      );

      const episodeUUIDs = progressRecords.map((p) => p.episodeUUID);
      const progressMap = new Map(
        progressRecords.map((p) => [p.episodeUUID, p.progress]),
      );

      // Step 2: Fetch episodes
      const _episodes =
        await this.chatSimulationService.getEpisodesByEpisodeUUID(episodeUUIDs);

      // Step 3: Reorder and attach progress
      const episodeMap = new Map(_episodes.map((e) => [e.episodeUUID, e]));

      const episodes = episodeUUIDs
        .map((uuid) => {
          const episode = episodeMap.get(uuid);
          if (!episode) return null;

          return {
            ...episode,
            progress: progressMap.get(uuid) ?? 0,
          };
        })
        .filter(Boolean);

      return { episodes, pagination };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Save podcast progress for a user
  async saveProgress(
    userUUID: string,
    { episodeUUID, progress, isCompleted }: PodcastProgressInput,
  ): Promise<void> {
    try {
      const key = `progress:${userUUID}`;

      let progressArray: any[] = [];

      const existing = await this.cacheService.get(key);
      if (existing) {
        progressArray = JSON.parse(existing);
      }

      const entryIndex = progressArray.findIndex(
        (entry) => entry.episodeUUID === episodeUUID,
      );

      const newEntry = {
        episodeUUID,
        progress,
        isCompleted,
        updatedAt: new Date().toISOString(), // Set the updatedAt to the current date and time
      };

      if (entryIndex !== -1) {
        progressArray[entryIndex] = newEntry; // Update existing entry
      } else {
        progressArray.push(newEntry); // Add new entry
      }

      await this.cacheService.set(key, JSON.stringify(progressArray));
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  // Sync podcast progress entries from Redis to the DB for a user
  async syncProgressToDbForUser(userUUID: string) {
    try {
      const key = `progress:${userUUID}`;
      const rawData: string = await this.cacheService.get(key);

      if (!rawData) return;

      let entries: any[];

      try {
        entries = JSON.parse(rawData);
        if (!Array.isArray(entries)) return;
      } catch {
        return;
      }

      for (const entry of entries) {
        const { episodeUUID, progress, isCompleted } = entry;

        if (!episodeUUID) continue; // Skip malformed entries

        // Upsert in DB (update if exists, create if not)
        await this.podcastProgressModel.updateOne(
          { userUUID, episodeUUID },
          { progress, isCompleted },
          { upsert: true },
        );
      }

      // After syncing, delete Redis key
      await this.cacheService.delete(key);

      // Optional: clean up completed entries for this user
      await this.podcastProgressModel.deleteMany({
        userUUID,
        isCompleted: true,
      });

      this.logger.log(
        `Synced all podcast progress entries for user ${userUUID}`,
      );
    } catch (error) {
      this.logger.error('Error syncing podcast progress:', error?.message);
    }
  }

  // Sync podcast progress entries from Redis to the DB
  @Interval(25 * 60 * 1000) // Run every 25 minutes
  async syncProgressToDbForUsers() {
    try {
      this.logger.log(`Started syncing podcast progress entries to DB`);

      const keys = await this.cacheService.getKeysByPattern('progress:*');
      const now = Date.now();
      const THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

      for (const key of keys) {
        const rawData: string = await this.cacheService.get(key);
        if (!rawData) continue;

        let entries: any[];

        try {
          entries = JSON.parse(rawData);
          if (!Array.isArray(entries)) continue;
        } catch {
          continue;
        }

        const [, userUUID] = key.split(':');
        const remaining: any[] = [];

        for (const entry of entries) {
          const { episodeUUID, progress, isCompleted, updatedAt } = entry;

          if (!episodeUUID || !updatedAt) {
            remaining.push(entry);
            continue;
          }

          // Check if the entry is old enough to be synced to the database
          const diffMs = now - new Date(updatedAt).getTime();
          if (diffMs < THRESHOLD_MS) {
            remaining.push(entry); // Not old enough yet
            continue;
          }

          // Upsert in DB (update if exists, create if not)
          await this.podcastProgressModel.updateOne(
            { userUUID, episodeUUID },
            { progress, isCompleted },
            { upsert: true },
          );
        }

        // Update Redis accordingly
        if (remaining.length) {
          await this.cacheService.set(key, JSON.stringify(remaining));
        } else {
          await this.cacheService.delete(key);
        }
      }

      // Delete all completed entries from DB
      await this.podcastProgressModel.deleteMany({ isCompleted: true });

      this.logger.log(`Completed syncing podcast progress entries to DB`);
    } catch (error) {
      this.logger.error('Error syncing podcast progress:', error?.message);
    }
  }

  // Generate RSS feed
  async generateRssFeed(): Promise<string> {
    try {
      const { episodes } = await this.chatSimulationService.getAllEpisodes(
        true,
        1,
        25,
      );

      if (!episodes.length) return;

      const now = new Date().toUTCString();

      const feedObject = {
        '?xml': {
          '@_version': '1.0',
          '@_encoding': 'UTF-8',
        },
        rss: {
          '@_version': '2.0',
          '@_xmlns:itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
          '@_xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
          channel: {
            title: 'Medscroll Podcast',
            description: 'Medscroll Podcast',
            link: 'https://medscroll.ai',
            language: 'en-us',
            copyright: `Copyright ${new Date().getFullYear()} Medscroll.ai`,
            lastBuildDate: now,
            pubDate: now,
            'itunes:author': 'Medscroll.ai',
            'itunes:summary': 'Medscroll Podcast',
            'itunes:type': 'episodic',
            'itunes:explicit': 'no',
            'itunes:image': {
              '@_href':
                'https://d1p9fc0i566fiv.cloudfront.net/logo-images/medscroll-logo-300x300.jpg',
            },
            'itunes:category': {
              '@_text': 'Health & Fitness',
              'itunes:category': {
                '@_text': 'Medicine',
              },
            },
            'itunes:owner': {
              'itunes:name': 'Medscroll.ai',
              'itunes:email': 'themedscroll@gmail.com',
            },
            item: episodes.map((episode) => ({
              title: episode?.episodeTitle,
              description: episode?.description,
              pubDate: new Date(episode.createdAt).toUTCString(),
              guid: {
                '#text': episode.episodeUUID,
                '@_isPermaLink': 'false',
              },
              link: `${this.configService.get('API')}/podcast/episode/${
                episode.episodeUUID
              }`,
              'itunes:title': episode?.episodeTitle,
              'itunes:author': 'Medscroll.ai',
              'itunes:summary': episode?.description,
              'itunes:duration': formatDuration(episode?.duration ?? 0),
              'itunes:explicit': 'no', //  Tells podcast platforms whether an episode contains explicit content (such as strong language, adult themes, or violence).
              'itunes:episodeType': 'full',
              enclosure: {
                '@_url': episode?.fileUrl,
                '@_length': episode?.audioSize,
                '@_type': 'audio/mpeg',
              },
            })),
          },
        },
      };

      return this.xmlBuilder.build(feedObject);
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Parse RSS feed XML to JS Object
  async parseRssFeed() {
    try {
      // 1. Fetch your RSS feed
      const response = await firstValueFrom(
        this.httpService.get(`${this.configService.get('API')}/podcast/feed`),
      );

      const xmlData = response.data;

      // 2. Parse XML to JS Object
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        isArray: (name) => ['item', 'itunes:category'].includes(name), // Handle arrays
      });

      return parser.parse(xmlData);
    } catch (error) {
      console.error('RSS Parsing failed:', error.message);
    }
  }

  // Get episode by episodeUUID
  async getEpisode(episodeUUID: string) {
    try {
      const episode = await this.chatSimulationService.getEpisodeById(
        episodeUUID,
      );

      return episode;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
}
