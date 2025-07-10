import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentResolver } from './resolver/agent.resolver';
import { AgentService } from './service/agent.service';
import { ElevenLabsService } from './service/elevenlabs.service';
import { OpenAIModule } from '../openAI/openAI.module';

@Module({
  imports: [HttpModule, forwardRef(() => OpenAIModule)],
  providers: [AgentResolver, AgentService, ElevenLabsService],
  exports: [AgentService, ElevenLabsService],
})
export class ElevenlabsModule {}
