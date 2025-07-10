/* eslint-disable prettier/prettier */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ThreadGrpEntity,
  ThreadGrpSchema,
} from 'src/llm-providers/openAI/entity/threadGrp.entity';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import {
  QuestionEntity,
  QuestionSchema,
} from 'src/quiz/entity/questions.entity';
import { QuizEntity, QuizSchema } from 'src/quiz/entity/quiz.entity';
import { PlaygroundResolver } from './resolver/playground.resolver';
import { PlaygroundService } from './service/playground.service';
import { QuizService } from 'src/quiz/service/quiz.service';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { QuizQueueService } from 'src/utilities/service/queue/queue.service';
import { QuizModule } from 'src/quiz/quiz.module';
import { BullModule } from '@nestjs/bull';
import { DriveService } from 'src/drive/service/drive.service';
import { DriveEntity, DriveSchema } from 'src/drive/entity/drive.entity';
import {
  MedSynopsisCategoryEntity,
  MedSynopsisCategorySchema,
} from 'src/medsynopsis/entity/medsynopsisCatergory.entity';
import {
  MedSynopsisCaseEntity,
  MedSynopsisCaseSchema,
} from 'src/medsynopsis/entity/medsynopsisCase.entity';
import {
  PlaygroundConfigEntity,
  PlaygroundConfigSchema,
} from './entity/playgroundconfig.entity';
import { PlaygroundPresResolver } from './resolver/playgroundPres.resolver';
import { PlaygroundPresentationService } from './service/playgroundPres.service';
import { PlaygroundPresentationEntity, PlaygroundPresentationSchema } from './entity/presentation.playground.entity';
import { GameEntity, GameSchema } from 'src/quiz/entity/game.entity';
import { WsEngagementService } from 'src/ws/service/ws.engagement.service';
import { WsNotificationService } from 'src/ws/service/ws.notification.service';
import { PresentationModule } from 'src/presentation/presentation.module';
import { WsService } from 'src/ws/service/ws.service';
import { UserModule } from 'src/user/user.module';
import { UserEntity, UserSchema } from 'src/user/entity/user.entity';
import { EngagementEntity, EngagementSchema } from 'src/quiz/entity/engagement.entity';
import { PresentationEntity, PresentationSchema } from 'src/presentation/entity/presentation.entity';
import { EngagementGuestEntity, EngagementGuestSchema } from 'src/quiz/entity/engagement.guest.entity';
import { ChatEpisodeEntity, ChatEpisodeSchema } from 'src/chat-simulation/entities/chat-episode-entity';
import { ChatSimulationModule } from 'src/chat-simulation/chat-simulation.module';
import { EngagementModule } from 'src/engagement/engagement.module';
import { WsModule } from 'src/ws/ws.module';
import { WsEngagementGateway } from 'src/ws/gateway/ws.engagement.gateway';
import { AuthService } from 'src/auth/service/auth.service';
import { UserService } from 'src/user/service/user.service';
import { WsNotificationGateway } from 'src/ws/gateway/ws.notification.gateway';
import { MailService } from 'src/mail/mail.service';
import { MailModule } from 'src/mail/mail.module';
import { AuthModule } from 'src/auth/auth.module';
import { PlaygroundPresCategoryEntity, PlaygroundPresCategorySchema } from './entity/playgroundPres.category';
import { PlaygroundPresCategoryResolver } from './resolver/playgroundPres.category.resolver';
import { PlaygroundPresCategoryService } from './service/playgroundPres.category.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: QuestionEntity.name,
        useFactory: () => {
          return QuestionSchema;
        },
      },
      {
        name: PlaygroundConfigEntity.name,
        useFactory: () => {
          return PlaygroundConfigSchema;
        },
      },
      {
        name: ThreadGrpEntity.name,
        useFactory: () => {
          return ThreadGrpSchema;
        },
      },
      {
        name: QuizEntity.name,
        useFactory: () => {
          return QuizSchema;
        },
      },
      {
        name: MedSynopsisCaseEntity.name,
        useFactory: () => {
          return MedSynopsisCaseSchema;
        },
      },
      {
        name: MedSynopsisCategoryEntity.name,
        useFactory: () => {
          return MedSynopsisCategorySchema;
        },
      },
      {
        name: MedSynopsisCategoryEntity.name,
        useFactory: () => {
          return MedSynopsisCategorySchema;
        },
      },
      {
        name: PlaygroundPresentationEntity.name,
        useFactory: () => {
          return PlaygroundPresentationSchema;
        },
      },
      {
        name: EngagementEntity.name,
        useFactory: () => {
          return EngagementSchema;
        },
      },
      {
        name: EngagementGuestEntity.name,
        useFactory: () => {
          return EngagementGuestSchema;
        },
      },
      {
        name: ChatEpisodeEntity.name,
        useFactory: () => {
          return ChatEpisodeSchema;
        },
      },
      {
        name: PresentationEntity.name,
        useFactory: () => {
          return PresentationSchema;
        },
      },

      {
        name: PlaygroundPresentationEntity.name,
        useFactory: () => {
          return PlaygroundPresentationSchema;
        },
      },

      {
        name: UserEntity.name,
        useFactory: () => {
          return UserSchema;
        },
      },
      {
        name: GameEntity.name,
        useFactory: () => {
          return GameSchema;
        },
      },
      {
        name: DriveEntity.name,
        useFactory: () => {
          return DriveSchema;
        },
      },
      {
        name: PlaygroundPresCategoryEntity.name,
        useFactory: () => {
          return PlaygroundPresCategorySchema;
        },
      },

    ]),
    BullModule.registerQueue({
      name: 'quiz',
    }),
    HttpModule,
    OpenAIModule,
    QuizModule,
    PresentationModule,
    ChatSimulationModule, 
    UserModule,
    WsModule,
    EngagementModule,
    AuthModule,
  ],
  providers: [
    AsstThreadService,
    QuizService,
    DriveService,
    QuizQueueService,
    PlaygroundService,
    PlaygroundResolver,
    PlaygroundPresentationService,
    PlaygroundPresResolver,
    PlaygroundPresCategoryService,
    PlaygroundPresCategoryResolver,
  ],
  exports: [],
})
export class PlaygroundModule {}
