import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueProcessorType, QueueProcessType } from '../enum/queue.enum';
import { UserDocument } from 'src/user/entity/user.entity';

@Injectable()
// export class ChatSimulationQueueService implements OnModuleInit {
export class ChatSimulationQueueService {
  private readonly logger = new Logger(ChatSimulationQueueService.name);
  constructor(
    @InjectQueue(QueueProcessorType.CHAT_SIMULATION)
    private readonly chatSimulationQueue: Queue,
  ) {}

  // async onModuleInit() {
  //   // Re-process failed jobs when the server restarts
  //   await this.retryFailedJobs();
  // }

  // async retryFailedJobs() {
  //   this.logger.debug('Checking for failed jobs...');
  //   const failedJobs = await this.chatSimulationQueue.getFailed();

  //   this.logger.debug(`Found ${failedJobs.length} failed jobs`);
  //   for (const job of failedJobs) {
  //     this.logger.debug(`Retrying job ${job.id}...`);
  //     await job.retry();
  //   }
  // }

  // Not in use (To be deleted)
  async scheduleEpisode(payload: any): Promise<string> {
    try {
      await this.chatSimulationQueue.add(
        QueueProcessType.EPISODE_SCHEDULING,
        payload,
        {
          priority: 1,
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
      return 'Episodes created successfully';
    } catch (error) {
      this.logger.error(`Error scheduling episodes: ${error}`);
    }
  }

  async saveSimulation(payload: any): Promise<string> {
    await this.chatSimulationQueue.add(
      QueueProcessType.GENERATE_SIMULATION,
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
    return `Simulation generation is queued`;
  }

  // generate podcast queue
  async generatePodcastQueue(user: UserDocument, simulationUUIDs: string[]) {
    const batchSize = 5;

    try {
      for (let i = 0; i < simulationUUIDs.length; i += batchSize) {
        const jobBatch: string[] = simulationUUIDs.slice(i, i + batchSize);

        await this.chatSimulationQueue.add(
          QueueProcessType.GENERATE_PODCAST,
          { user, simulationUUIDs: jobBatch },
          {
            priority: 1,
            removeOnComplete: true,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Error generating podcast queue: ${error}`);
    }
  }
}
