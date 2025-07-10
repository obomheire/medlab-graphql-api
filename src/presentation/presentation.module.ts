import { forwardRef, Global, Module } from '@nestjs/common';
import { PresentationResolver } from './resolver/presentation.resolver';
import { PresentationService } from './service/presentation.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PresentationEntity,
  PresentationSchema,
} from './entity/presentation.entity';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { QuizModule } from 'src/quiz/quiz.module';
import { GameEntity, GameSchema } from 'src/quiz/entity/game.entity';
import { WsEngagementService } from 'src/ws/service/ws.engagement.service';
import { WsModule } from 'src/ws/ws.module';
import { HttpModule } from '@nestjs/axios';
import { WsNotificationGateway } from 'src/ws/gateway/ws.notification.gateway';
import { WsNotificationService } from 'src/ws/service/ws.notification.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: PresentationEntity.name,
        useFactory: () => {
          return PresentationSchema;
        },
      },
      {
        name: GameEntity.name,
        useFactory: () => {
          return GameSchema;
        },
      },
    ]),
    AuthModule,
    QuizModule,
    OpenAIModule,
    HttpModule,
    forwardRef(() => WsModule),
  ],
  providers: [
    PresentationResolver,
    PresentationService,
    WsNotificationGateway,
    WsNotificationService,
  ],
  exports: [PresentationService],
})
export class PresentationModule {}
