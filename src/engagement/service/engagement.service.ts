import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { EngagementDocument } from 'src/quiz/entity/engagement.entity';
import { EngagementEntity } from 'src/quiz/entity/engagement.entity';
import { UserService } from 'src/user/service/user.service';
import { ThreadMessageInput } from 'src/llm-providers/openAI/dto/assistant.input';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import { UserDocument } from 'src/user/entity/user.entity';

@Injectable()
export class EngagementService {
  constructor(
    @InjectModel(EngagementEntity.name)
    private readonly engagementModel: Model<EngagementDocument>,
    private asstThreadService: AsstThreadService,
  ) {}

  // Get engagement by invite code
  async getEngagementByInviteCode(
    inviteCode: string,
  ): Promise<EngagementDocument> {
    try {
      const engagement = await this.engagementModel.findOne({ inviteCode });

      if (!engagement) throw new BadRequestException('Invalid invite code!');

      return engagement;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Handle ai response
  async aiAssistant(
    prompt: string,
    presentationThreadId: string,
    user: UserDocument,
  ): Promise<{ comment: string; threadId: string; messageId: string }> {
    try {
      const threadMessageInput: ThreadMessageInput = {
        threadId: presentationThreadId,
        message: prompt,
      };

      const {
        message: content,
        threadId: chatThreadId,
        messageId,
      } = await this.asstThreadService.addMessage(
        user,
        threadMessageInput,
        ComponentType.ENGAGEMENT,
        null,
        [],
        'engagement-images',
      );

      return {
        comment: content,
        threadId: chatThreadId,
        messageId,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
}
