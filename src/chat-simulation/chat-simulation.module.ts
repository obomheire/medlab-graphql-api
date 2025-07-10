import { Module } from '@nestjs/common';
import { ChatSimulationService } from './service/chat-simulation.service';
import { ChatSimulationResolver } from './resolver/chat-simulation.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatCategoryEntity,
  ChatCategorySchema,
} from './entities/chat-category.entity';
import {
  ChatChannelEntity,
  ChatChannelSchema,
} from './entities/chat-channel.entity';
import { ChatEventEntity, ChatEventSchema } from './entities/chat-event.entity';
import {
  ChatEpisodeEntity,
  ChatEpisodeSchema,
} from './entities/chat-episode-entity';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import {
  ChatAIAvatarEntity,
  ChatAIAvatarSchema,
} from './entities/chat.avatar.entity';
import { UserModule } from 'src/user/user.module';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { QueueModule } from 'src/queue/queue.module';
import {
  ChatSimulationEntity,
  ChatSimulationSchema,
} from './entities/chat-simulation-entity';
import { ChatSimulationMobileService } from './service/chat-simulation.mobile.service';
import {
  ChatUserActivityEntity,
  ChatUserActivitySchema,
} from './entities/chat-user-activity.entity';
import { ChatSimulationMobileResolver } from './resolver/chat.simulation.mobile.resolver';
import {
  ChatAIRolesEntity,
  ChatAIRolesSchema,
} from './entities/chat.roles.entity';
import {
  ChatSimulationGeneratingProgressEntity,
  ChatSimulationGeneratingProgressSchema,
} from './entities/chat-simulation-progress.entity';
import { ElevenlabsModule } from 'src/llm-providers/elevenlabs/elevenlabs.module';
import { PodcastController } from './controller/podcast.controller';
import { PodcastService } from './service/podcast.service';
import { PodcastResolver } from './resolver/podcast.resolver';
import { ScheduleModule } from '@nestjs/schedule';
import {
  PodcastProgressEntity,
  PodcastProgressSchema,
} from './entities/podcast-progress.entity';
import { HttpModule } from '@nestjs/axios';
import { ChatSimulationController } from './controller/chat-simulation.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    MongooseModule.forFeatureAsync([
      {
        name: ChatCategoryEntity.name,
        useFactory: () => {
          return ChatCategorySchema;
        },
      },
      {
        name: ChatChannelEntity.name,
        useFactory: () => {
          return ChatChannelSchema;
        },
      },
      {
        name: ChatEventEntity.name,
        useFactory: () => {
          return ChatEventSchema;
        },
      },
      {
        name: ChatEpisodeEntity.name,
        useFactory: () => {
          return ChatEpisodeSchema;
        },
      },
      {
        name: ChatAIAvatarEntity.name,
        useFactory: () => {
          return ChatAIAvatarSchema;
        },
      },
      {
        name: ChatSimulationEntity.name,
        useFactory: () => {
          return ChatSimulationSchema;
        },
      },
      {
        name: ChatUserActivityEntity.name,
        useFactory: () => {
          return ChatUserActivitySchema;
        },
      },
      {
        name: ChatAIRolesEntity.name,
        useFactory: () => {
          return ChatAIRolesSchema;
        },
      },
      {
        name: ChatSimulationGeneratingProgressEntity.name,
        useFactory: () => {
          return ChatSimulationGeneratingProgressSchema;
        },
      },
      {
        name: PodcastProgressEntity.name,
        useFactory: () => {
          return PodcastProgressSchema;
        },
      },
    ]),
    UserModule,
    OpenAIModule,
    QueueModule,
    ElevenlabsModule,
  ],
  controllers: [PodcastController, ChatSimulationController],
  providers: [
    ChatSimulationResolver,
    ChatSimulationMobileResolver,
    ChatSimulationMobileService,
    AwsS3Service,
    ChatSimulationService,
    PodcastResolver,
    PodcastService,
  ],
  exports: [ChatSimulationService, ChatSimulationMobileService, PodcastService],
})
export class ChatSimulationModule {}
