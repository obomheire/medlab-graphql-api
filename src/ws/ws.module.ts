import { forwardRef, Module } from '@nestjs/common';
import { WsService } from './service/ws.service';
import { WsGateway } from './gateway/ws.gateway';
import { QuizModule } from 'src/quiz/quiz.module';
import { AuthModule } from 'src/auth/auth.module';
import { WsPlayerGateway } from './gateway/ws.player.gateway';
import { WsPalyerService } from './service/ws.player.service';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { PresentationModule } from 'src/presentation/presentation.module';
import { WsSlideGateway } from './gateway/ws.slide.gateway';
import { WsSlideService } from './service/ws.slide.service';
import { ChatSimulationModule } from 'src/chat-simulation/chat-simulation.module';
import { WsChannelService } from './service/ws.channel.service';
import { WsChannelGateway } from './gateway/ws.channel.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from 'src/user/entity/user.entity';
import {
  EngagementEntity,
  EngagementSchema,
} from 'src/quiz/entity/engagement.entity';
import {
  PresentationEntity,
  PresentationSchema,
} from 'src/presentation/entity/presentation.entity';
import { WsEngagementGateway } from './gateway/ws.engagement.gateway';
import { WsEngagementService } from './service/ws.engagement.service';
import {
  EngagementGuestEntity,
  EngagementGuestSchema,
} from 'src/quiz/entity/engagement.guest.entity';
import {
  ChatEpisodeEntity,
  ChatEpisodeSchema,
} from 'src/chat-simulation/entities/chat-episode-entity';
import { EngagementModule } from 'src/engagement/engagement.module';
import { CacheModule } from 'src/cache/cache.module';
import { WsNotificationGateway } from './gateway/ws.notification.gateway';
import { WsNotificationService } from './service/ws.notification.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserSchema },
      { name: EngagementEntity.name, schema: EngagementSchema },
      { name: PresentationEntity.name, schema: PresentationSchema },
      { name: EngagementGuestEntity.name, schema: EngagementGuestSchema },
      { name: ChatEpisodeEntity.name, schema: ChatEpisodeSchema },
    ]),
    QuizModule,
    AuthModule,
    OpenAIModule,
    forwardRef(() => PresentationModule),
    ChatSimulationModule,
    EngagementModule,
    CacheModule,
    ChatSimulationModule,
  ],
  providers: [
    WsGateway,
    WsPlayerGateway,
    WsSlideGateway,
    WsChannelGateway,
    WsEngagementGateway,
    WsNotificationGateway,
    WsService,
    WsPalyerService,
    WsSlideService,
    WsChannelService,
    WsEngagementService,
    WsNotificationService,
  ],
  exports: [
    WsEngagementService,
    WsNotificationService,
    WsGateway,
    WsPlayerGateway,
    WsSlideGateway,
    WsChannelGateway,
    WsEngagementGateway,
    WsNotificationGateway,
    WsService,
    WsPalyerService,
    WsSlideService,
    WsChannelService,
  ],
})
export class WsModule {}
