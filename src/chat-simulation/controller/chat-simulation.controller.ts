import {
  Controller,
  Body,
  Headers,
  ForbiddenException,
  Post,
} from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';
import { ChatSimulationService } from '../service/chat-simulation.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class ChatSimulationController {
  constructor(
    private readonly chatSimulationService: ChatSimulationService,
    private configService: ConfigService,
  ) {}

  // Handle webhook for live episodes
  @Public()
  @Post('live-episodes')
  liveEpisodesWebhook(
    @Headers('x-secret-key') secretKey: string,
    @Body() body: { episodeUUIDs: string[] },
  ) {
    if (
      secretKey !== this.configService.get<string>('DATABASE_TRIGGER_SECRET')
    ) {
      throw new ForbiddenException('Invalid secret key');
    }

    this.chatSimulationService.liveEpisodes(body?.episodeUUIDs);

    // Return success response
    return { message: 'Webhook received', data: body };
  }
}
