import { forwardRef, Module } from '@nestjs/common';
import { ChatSimulationProcessor } from './processes/chatSimulation.processor';
import { ChatSimulationQueueService } from './services/chatSimulation.queue.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatEpisodeEntity,
  ChatEpisodeSchema,
} from 'src/chat-simulation/entities/chat-episode-entity';
import { BullModule } from '@nestjs/bull';
import {
  ChatSimulationEntity,
  ChatSimulationSchema,
} from 'src/chat-simulation/entities/chat-simulation-entity';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { UserModule } from 'src/user/user.module';
import {
  ChatEventEntity,
  ChatEventSchema,
} from 'src/chat-simulation/entities/chat-event.entity';
import { ChatSimulationModule } from 'src/chat-simulation/chat-simulation.module';
import { ElevenlabsModule } from 'src/llm-providers/elevenlabs/elevenlabs.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: ChatEpisodeEntity.name,
        useFactory: () => {
          return ChatEpisodeSchema;
        },
      },
      {
        name: ChatEventEntity.name,
        useFactory: () => {
          return ChatEventSchema;
        },
      },
      {
        name: ChatSimulationEntity.name,
        useFactory: () => {
          return ChatSimulationSchema;
        },
      },
    ]),
    BullModule.registerQueue({
      name: 'chat-simulation',
    }),
    OpenAIModule,
    UserModule,
    forwardRef(() => ChatSimulationModule),
    ElevenlabsModule,
  ],
  providers: [ChatSimulationProcessor, ChatSimulationQueueService],
  exports: [ChatSimulationQueueService, ChatSimulationProcessor],
})
export class QueueModule {}
