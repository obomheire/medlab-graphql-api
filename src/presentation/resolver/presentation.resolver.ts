import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { ObjectId } from 'mongodb';
import { PresentationService } from '../service/presentation.service';
import {
  ConfigPresInput,
  PresImageInput,
  PresInput,
  PresQuizInput,
  PresQuizOrPollInput,
  UpdatePresInput,
} from '../dto/presentation.input';
import { UserDocument } from 'src/user/entity/user.entity';
import { PresentationEntity } from '../entity/presentation.entity';
import { MessageRes } from 'src/auth/types/auth.types';
import {
  AssistantRes,
  PresPromptRes,
  QuizAIRes,
} from 'src/llm-providers/openAI/types/ai.type';
import {
  FilterGetPresArgs,
  GetPresRes,
  PresImageRes,
} from '../types/presentation.types';
import { SlideCreditGuard } from 'src/auth/guard/slideCredit.guard';
import { QuizPromptInput } from 'src/llm-providers/openAI/dto/quizAI.input';

@Resolver()
export class PresentationResolver {
  constructor(private readonly presentationService: PresentationService) {}

  // Configure presentation
  @UseGuards(AccessTokenAuthGuard, SlideCreditGuard)
  @Mutation(() => AssistantRes)
  async configPresentation(
    @GetUser() user: UserDocument,
    @Args('configPresInput') configPresInput: ConfigPresInput,
    @Args({ name: 'files', type: () => [GraphQLUpload], nullable: true })
    files?: FileUpload[],
  ) {
    return await this.presentationService.configPresentation(
      user,
      configPresInput,
      files,
    );
  }

  // Submit presentation
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => PresentationEntity)
  async createPresentation(
    @GetUser() user: UserDocument,
    @Args('presInput') presInput: PresInput,
  ) {
    return await this.presentationService.createPresentation(user, presInput);
  }

  // Start presentation
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => PresentationEntity)
  async startPresentation(
    @GetUser() user: UserDocument,
    @Args('presUUID') presUUID: string,
  ) {
    return await this.presentationService.startPresentation(
      presUUID,
      user.userUUID,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => String)
  async generatePresImage_v2(
    @Args('message', { type: () => [PresImageInput] })
    message: PresImageInput[],
    @GetUser() user: UserDocument,
  ) {
    return await this.presentationService.generateSlideImage_v2(
      user.userUUID,
      message,
    );
  }

  // Get next question
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PresentationEntity)
  async getPresNextQuestion(
    @Args('inviteCode') inviteCode: string,
    @Args('questionType') questionType: string,
  ) {
    return await this.presentationService.getPresNextQuestion(
      inviteCode,
      questionType,
    );
  }

  // Get all presentations
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => GetPresRes)
  async getPresentations(
    @GetUser('_id') userId: ObjectId,
    @Args() { accessMode, isDraft, page, limit }: FilterGetPresArgs,
  ) {
    return await this.presentationService.getPresentations(
      userId,
      accessMode,
      isDraft,
      page || 1,
      limit || 15,
    );
  }

  // Get a single presentation by UUID
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PresentationEntity)
  async getPresentation(@Args('presUUID') presUUID: string) {
    return await this.presentationService.getPresentation(presUUID);
  }

  // Get a single presentation by join code
  @Query(() => PresentationEntity)
  async getPresByInviteCode(@Args('joinCode') joinCode: string) {
    return await this.presentationService.getPresByInviteCode(joinCode);
  }

  // Update presentation
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => PresentationEntity)
  async updatePresentation(
    @Args('updatePresInput') updatePresInput: UpdatePresInput,
  ) {
    return await this.presentationService.updatePresentation(updatePresInput);
  }

  // Delete presentation
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  async deletePresentation(@Args('presUUID') presUUID: string) {
    return await this.presentationService.deletePresentation(presUUID);
  }

  // Add message to thread
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => QuizAIRes)
  async generatePresQuiz_v2(
    @GetUser() user: UserDocument,
    @Args('presQuizInput') presQuizInput: QuizPromptInput,
  ) {
    return await this.presentationService.generatePresQuiz_v2(
      user,
      presQuizInput,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => String)
  async generatePresImage(@Args('message') message: string) {
    return await this.presentationService.generateSlideImage(message);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => QuizAIRes)
  async generatePresQuiz(
    @GetUser() user: UserDocument,
    @Args('presQuizInput') presQuizInput: QuizPromptInput,
  ) {
    return await this.presentationService.generatePresQuiz(user, presQuizInput);
  }
}
