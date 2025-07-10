import { UseGuards } from '@nestjs/common';
import { QuizAIService } from '../service/ai.quiz.service';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CasePromptRes, OpenEndedAIRes, QuizAIRes } from '../types/ai.type';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { CreditControlGuard } from 'src/auth/guard/creditControl.guard';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { CasePromptInput, QuizPromptInput } from '../dto/quizAI.input';
import {
  CreateOpenEndedQuesInput,
  SubmitOpenEndedResInput,
} from 'src/quiz/dto/question.input';
import { OpenEndedQuizScoreRes } from 'src/quiz/types/quiz.types';
import { UserDocument } from 'src/user/entity/user.entity';
import { GuestGuard } from 'src/auth/guard/guest.guard';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class QuizAIResolver {
  constructor(private readonly quizAIService: QuizAIService) {}

  // Generate questions for quiz with AI model
  @UseGuards(GuestGuard, CreditControlGuard)
  @Mutation(() => QuizAIRes)
  async generateAIquiz(
    @GetUser() user: UserDocument,
    @Args('quizPromptInput') quizPromptInput: QuizPromptInput,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ) {
    return await this.quizAIService.generateAIquiz(user, quizPromptInput, file);
  }

  // Generate case and questions with AI model
  @UseGuards(GuestGuard, CreditControlGuard)
  @Mutation(() => CasePromptRes)
  async generateAIcase(
    @GetUser() user: UserDocument,
    @Args('casePromptInput') casePromptInput: CasePromptInput,
  ) {
    return await this.quizAIService.generateAIcase(user, casePromptInput);
  }

  // generate open ended questions
  @Mutation(() => OpenEndedAIRes)
  async generateOpenEndedQuesAdmin(
    @Args('createOpenEndedQuesInput')
    createOpenEndedQuesInput: CreateOpenEndedQuesInput,
  ) {
    return await this.quizAIService.generateOpenEndedQuesAdmin(
      createOpenEndedQuesInput,
    );
  }

  // Submit response for open ended questions
  @Mutation(() => OpenEndedQuizScoreRes)
  async submitOpenEndedResponse(
    @GetUser() user: UserDocument,
    @Args('submitResInput') submitResInput: SubmitOpenEndedResInput,
  ) {
    return await this.quizAIService.submitOpenEndedResponse(
      user,
      submitResInput,
    );
  }
}
