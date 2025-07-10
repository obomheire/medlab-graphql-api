import { Public } from 'src/auth/decorator/public.decorator';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ReqWithRawBody } from 'src/utilities/interface/interface';
import { AgentService } from '../service/agent.service';

@Controller('elevenlabs')
export class ElevenLabsController {
  constructor(private readonly agentService: AgentService) {}

  // ElevenLabs webhook endpoint
  @Public()
  @Post('post/conversation/webhook')
  @HttpCode(200)
  async conversation(@Body() body: any) {
    // return await this.agentService.retrieveConversation(
    //   signature,
    //   request.rawBody,
    // );
  }
}
