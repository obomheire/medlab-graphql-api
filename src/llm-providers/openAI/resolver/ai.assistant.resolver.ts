import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AIasistantService } from '../service/ai.assistant.service';
import {
  AssistantRes,
  AssistantVSRes,
  CreateAsstRes,
  ListAsstRes,
} from '../types/ai.type';
import { MessageRes } from 'src/auth/types/auth.types';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { PermissionsType } from 'src/user/enum/user.enum';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import {
  ChatAssInput,
  GenImageInput,
  SlideAssInput,
} from '../dto/assistant.input';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { DataRes } from 'src/stripe/types/stripe.types';
import { UserDocument } from 'src/user/entity/user.entity';

@UseGuards(AccessTokenAuthGuard)
@Permissions(PermissionsType.SUPER_ADMIN)
@Resolver()
export class AssistantAIResolver {
  constructor(private readonly aiAssistantService: AIasistantService) {}

  // Create AI assistant
  @UseGuards(PermissionsGuard)
  @Mutation(() => CreateAsstRes)
  async createAssistant() {
    return await this.aiAssistantService.createAssistant();
  }

  // List all assistants
  @UseGuards(PermissionsGuard)
  @Query(() => [ListAsstRes])
  async listAssistants() {
    return await this.aiAssistantService.listAssistants();
  }

  // retrieve assistant
  @UseGuards(PermissionsGuard)
  @Query(() => ListAsstRes)
  async retrieveAssistant(@Args('assistantId') assistantId: string) {
    return await this.aiAssistantService.retrieveAssistant(assistantId);
  }

  // Create AI assistant
  @UseGuards(PermissionsGuard)
  @Mutation(() => ListAsstRes)
  async updateAssistant(@Args('assistantId') assistantId: string) {
    return await this.aiAssistantService.updateAssistant(assistantId);
  }

  // Delete AI assistant
  @UseGuards(PermissionsGuard)
  @Query(() => MessageRes)
  async deleteAssistant(@Args('assistantId') assistantId: string) {
    return await this.aiAssistantService.deleteAssistant(assistantId);
  }

  // Assistant AI
  @Query(() => AssistantRes)
  async slideAssistantAI(
    @GetUser() user: UserDocument,
    @Args('slideAssInput') slideAssInput: SlideAssInput,
  ) {
    return await this.aiAssistantService.slideAssistantAI(user, slideAssInput);
  }

  @Query(() => AssistantRes)
  async slideMedScrollAssistantAI(
    @Args('slideAssInput') slideAssInput: SlideAssInput,
  ) {
    return await this.aiAssistantService.slideMedScrollAssistantAI(
      slideAssInput,
    );
  }

  // Assistant AI
  @Query(() => AssistantRes)
  async chatAssistantAI(
    @GetUser() user: UserDocument,
    @Args('chatAssInput') { prompt }: ChatAssInput,
  ) {
    return await this.aiAssistantService.chatAssistantAI(user, prompt);
  }

  // Create assistant vector store and upload files
  @UseGuards(PermissionsGuard)
  @Mutation(() => AssistantVSRes)
  async createAndAddFillesToVS(
    @Args({ name: 'files', type: () => [GraphQLUpload] })
    files: FileUpload[],
  ) {
    return await this.aiAssistantService.createAndAddFillesToVS(files);
  }

  // Generate images
  @UseGuards(PermissionsGuard)
  @Query(() => DataRes)
  async generateImage(
    @Args('genImageInput') { imageNo, prompt }: GenImageInput,
  ) {
    return await this.aiAssistantService.generateImage(prompt, imageNo);
  }
}
