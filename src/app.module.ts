/* eslint-disable prettier/prettier */
import { Logger, Module, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { QuizModule } from './quiz/quiz.module';
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';
import { FilesModule } from './files/files.module';
import { ScheduleTaskModule } from './schedule-task/schedule-task.module';
import { RevenuecatModule } from './revenuecat/revenuecat.module';
import { WsModule } from './ws/ws.module';
import { ApiSecurityGuard } from './auth/guard/apiSecurity.guard.';
import { EnvType } from './utilities/enum/env.enum';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OpenAIModule } from './llm-providers/openAI/openAI.module';
import { BullModule, BullQueueEvents, InjectQueue } from '@nestjs/bull';
import { ProductModule } from './products/products.module';
import { MedSynopsisModule } from './medsynopsis/medsynopsis.module';
import { ExamPrepModule } from './exam-prep/exam-prep.module';
import { StripeModule } from './stripe/stripe.module';
import { PlaygroundModule } from './playground/playground.module';
import { DriveModule } from './drive/drive.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AmplitudeModule } from './amplitude/amplitude.module';
import { SharedModule } from './shared/shared.module';
import { ChatSimulationModule } from './chat-simulation/chat-simulation.module';
import { QueueModule } from './queue/queue.module';
import { Queue } from 'bull';
import { CacheModule } from './cache/cache.module';
import { ClinicalExamModule } from './clinicalExam/clinicalExam.module';
import { EngagementModule } from './engagement/engagement.module';
import { ElevenlabsModule } from './llm-providers/elevenlabs/elevenlabs.module';
import { UtilitiesModule } from './utilities/utilities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false,
      introspection: process.env.NODE_ENV === EnvType.DEVELOP,
      context: ({ req, res }) => ({ req, res }),
      subscriptions: {
        'graphql-ws': true,
      },
      plugins: [
        process.env.NODE_ENV === EnvType.DEVELOP
          ? ApolloServerPluginLandingPageLocalDefault()
          : ApolloServerPluginLandingPageProductionDefault(),
      ],
      formatError: (error: GraphQLError) => {
        // Split the message by semicolon
        const errorMessage = error.message.split(';');

        // Extract the message after the last semicolon
        const getMessage = errorMessage[errorMessage.length - 1].trim();

        // Remove the escaped quotes from the message
        const cleanMessage = getMessage.replace(/\"/g, '');

        return {
          status: error.extensions?.code,
          message: cleanMessage,
        };
      },
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT')) || 6379,
          password: configService.get('REDIS_PASSWORD') || '',
          username: configService.get('REDIS_USERNAME') || '',
        },
        defaultJobOptions: {
          removeOnFail: false,
          attempts: 5,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'default',
    }),
    AuthModule,
    UserModule,
    MailModule,
    QuizModule,
    FilesModule,
    ScheduleTaskModule,
    RevenuecatModule,
    WsModule,
    OpenAIModule,
    ElevenlabsModule,
    ProductModule,
    MedSynopsisModule,
    ExamPrepModule,
    StripeModule,
    PlaygroundModule,
    DriveModule,
    OnboardingModule,
    AmplitudeModule,
    SharedModule,
    ChatSimulationModule,
    QueueModule,
    CacheModule,
    ClinicalExamModule,
    EngagementModule,
    UtilitiesModule,
  ],
  providers: [
    AppService,
    AppResolver,
    {
      provide: APP_GUARD,
      useClass: ApiSecurityGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(@InjectQueue('default') private readonly defaultQueue: Queue) {}

  async onModuleInit() {
    try {
      const redisClient = this.defaultQueue.client;
      if (redisClient.status === 'connect' || redisClient.status === 'ready') {
        this.logger.log('Redis is connected and ready.');
      }

      // Listen for connection events
      redisClient.on('connection', () => {
        this.logger.log('Redis is connected.');
      });
      redisClient.on('error', (error) => {
        this.logger.error(`Redis connection error: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Failed to initialize Redis logging: ${error.message}`);
    }
  }
}
