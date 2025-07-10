import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreditControlGuard } from 'src/auth/guard/creditControl.guard';
import {
  AssistantRes,
  ListMessageArgs,
  ThreadGrpRes,
  UploadFileRes,
} from '../types/ai.type';
import { AsstThreadService } from '../service/ai.thread.service';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { ThreadMessageInput, UpdateThreadInput } from '../dto/assistant.input';
import { MessageRes } from 'src/auth/types/auth.types';
import { Thread } from '../entity/types.entity';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { ComponentType } from '../enum/assistantAI.enum';
import { ObjectId } from 'mongodb';
import { DataRes } from 'src/stripe/types/stripe.types';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { UserDocument } from 'src/user/entity/user.entity';
import { GuestGuard } from 'src/auth/guard/guest.guard';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Resolver()
export class AsstThreadResolver {
  constructor(private readonly asstThreadService: AsstThreadService) {}

  // Delete thread
  @Query(() => MessageRes)
  async deleteThread(@Args('threadId') threadId: string) {
    return await this.asstThreadService.deleteThread(threadId);
  }

  // Update thread in thread group
  @Mutation(() => Thread)
  async updateThread(
    @Args('updateThreadInput') { threadId, description }: UpdateThreadInput,
  ) {
    return await this.asstThreadService.updateThread(threadId, description);
  }

  // Get all threads by userId
  @Query(() => [ThreadGrpRes])
  async getThreadGrp(
    @GetUser('_id') userId: ObjectId,
    @Args('component', {
      nullable: true,
      description:
        'Default to CASE_PRESENTATION. Accept CASE_RECALL, QUIZ_AI, EXAMPREP, DxQuest, OPENENDED, USER_MEDSYNOPSIS or MEDSYNOPSIS',
    })
    component: ComponentType,
  ) {
    return await this.asstThreadService.getThreadGrp(
      userId,
      component || ComponentType.CASE_PRESENTATION,
    );
  }

  // Delete thread group
  @Query(() => MessageRes)
  async deleteThreadGrp(@Args('threadGrpUUID') threadGrpUUID: string) {
    return await this.asstThreadService.deleteThreadGrp(threadGrpUUID);
  }

  // Add message to thread
  @UseGuards(GuestGuard, CreditControlGuard)
  @Mutation(() => AssistantRes)
  async addMessage(
    @GetUser() user: UserDocument,
    @Args('threadMessageInput') threadMessageInput: ThreadMessageInput,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ) {
    const { message } = threadMessageInput;
    return await this.asstThreadService.addMessage(
      user,
      threadMessageInput,
      ComponentType.CASE_PRESENTATION,
      message,
      file ? [file] : [],
      'case-presentation-files',
    );
  }

  // Lsit messages by thread Id
  @Query(() => [AssistantRes])
  async listMessagesByThreadId(@Args() { threadId, limit }: ListMessageArgs) {
    return await this.asstThreadService.listMessagesByThreadId(threadId, limit);
  }

  // Transcribe file
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => String)
  async transcribeFile(
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ) {
    return await this.asstThreadService.transcribeFileGroqAI(file);
  }

  // Create vector store
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => MessageRes)
  async createVectorStore() {
    return await this.asstThreadService.createVectorStore();
  }

  // List vector store
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => DataRes)
  async listVectorStores(
    @Args('limit', { nullable: true }) limit: number,
    @Args('after', { nullable: true }) after: string,
  ) {
    return await this.asstThreadService.listVectorStores(limit, after);
  }

  // List files
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => DataRes)
  async listFiles() {
    return await this.asstThreadService.listFiles();
  }

  // Delete vector store
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => MessageRes)
  async deleteVectorStore(@Args('vectorStorId') vectorStorId: string) {
    return await this.asstThreadService.deleteVectorStore(vectorStorId);
  }

  // Upload file to openai file
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => UploadFileRes)
  async uploadFileToOpenai(
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ) {
    return await this.asstThreadService.uploadFileToOpenai(file);
  }
}
