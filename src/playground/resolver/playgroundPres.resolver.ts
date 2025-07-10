import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { AssistantRes } from 'src/llm-providers/openAI/types/ai.type';
import { ConfigPresInput, UpdatePresInput } from 'src/presentation/dto/presentation.input';
import { PlaygroundPresentationService } from '../service/playgroundPres.service';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { PlaygroundSlideUploadRes } from '../types/playground.slide.types';
import { QuizAIRes } from 'src/llm-providers/openAI/types/ai.type';
import { QuizPromptInput } from 'src/llm-providers/openAI/dto/quizAI.input';
import { PlaygroundPresInput, PlaygroundPresSettingsInput } from '../dto/playgroundPres.category.dto';
import { PlaygroundPresentationEntity } from '../entity/presentation.playground.entity';

@Resolver()
export class PlaygroundPresResolver {
  constructor(
    private readonly playgroundPresService: PlaygroundPresentationService,
  ) {}

  // Configure presentation
  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => AssistantRes)
  async configPlaygroundPresentation(
    @Args('configPresInput') configPresInput: ConfigPresInput,
    @Args({ name: 'outline', type: () => GraphQLUpload, nullable: true })
    outline?: FileUpload,
    @Args({
      name: 'additionalFiles',
      type: () => GraphQLUpload,
      nullable: true,
    })
    additionalFiles?: FileUpload,
  ) {
    return await this.playgroundPresService.configPlaygroundPresentation(
      configPresInput,
      outline,
      additionalFiles,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => PlaygroundSlideUploadRes)
  async uploadSlidePresentation(
    @Args('slideImages', { type: () => [GraphQLUpload], nullable: true })
    slideImages?: FileUpload[],
    @Args('embedLink', { nullable: true })
    embedLink?: string,
  ) {
    return await this.playgroundPresService.uploadSlidePresentation(
      slideImages,
      embedLink,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => QuizAIRes)
  async generatePresQuizOrPoll(@Args('payload') payload: QuizPromptInput) {
    return await this.playgroundPresService.generatePresQuizOrPoll(payload);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => PlaygroundPresentationEntity)
  async createPlaygroundPres(
    @Args('playgroundPresInput') playgroundPresInput: PlaygroundPresInput,
  ) {
    return await this.playgroundPresService.createPlaygroundPres(
      playgroundPresInput,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => [PlaygroundPresentationEntity])
  async getPlaygroundPresentations() {
    return await this.playgroundPresService.getPlaygroundPresentations();
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => PlaygroundPresentationEntity)
  async getPlaygroundPresentation(@Args('presUUID') presUUID: string) {
    return await this.playgroundPresService.getPresByUUID(presUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => [PlaygroundPresentationEntity])
  async getUnpublishedPlaygroundPresentations() {
    return await this.playgroundPresService.getUnpublishedPlaygroundPresentations();
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => [PlaygroundPresentationEntity])
  async getInReviewPlaygroundPresentations() {
    return await this.playgroundPresService.getInReviewPlaygroundPresentations();
  }


  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => [PlaygroundPresentationEntity])
  async getPlaygroundPresDrafts() {
    return await this.playgroundPresService.getPlaygroundPresDrafts();
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => String)
  async updatePresSettings(
    @Args('presUUID') presUUID: string,
    @Args('settings') settings: PlaygroundPresSettingsInput,
  ) {
    return await this.playgroundPresService.updatePresSettings(
      presUUID,
      settings,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => PlaygroundPresentationEntity)
  async updatePlaygroundPres(
    @Args('updatePresInput') updatePresInput: UpdatePresInput,
  ) {
    return await this.playgroundPresService.updatePlaygroundPres(
      updatePresInput,
    );
  }
}