import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { OnboardingService } from '../service/onboarding.service';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { ObjectId } from 'mongodb';

import { AskQuestionInput } from '../dto/onboarding.dto';
import { AskQuestionRes } from '../types/oboarding.types';
import { UserDocument } from 'src/user/entity/user.entity';

@Resolver()
export class OnboardingResolver {
  constructor(private onboardingService: OnboardingService) {}

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => AskQuestionRes)
  async askQuestion(
    @GetUser() user: UserDocument,
    @Args({ name: 'conversationRes', nullable: true })
    conversationRes: AskQuestionInput,
  ) {
    return this.onboardingService.askQuestion(user, conversationRes);
  }
}
