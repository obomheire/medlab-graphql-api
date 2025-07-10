import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CaseService } from '../service/case.service';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { GetCasesQuesRes, UploadQsImageRes } from '../types/quiz.types';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { CaseEntity } from '../entity/case.entity';
import {
  CreateCaseInput,
  SubmitCaseRes,
  SubmitCaseResInput,
  UpdateCaseInput,
} from '../dto/case.input';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { PaginationArgs } from '../dto/question.input';
import { MessageRes } from 'src/auth/types/auth.types';
import { UserDocument } from 'src/user/entity/user.entity';

@Resolver()
@UseGuards(AccessTokenAuthGuard)
export class CaseResolver {
  constructor(private readonly caseService: CaseService) {}

  @Mutation(() => UploadQsImageRes)
  async uploadImageToCase(
    @Args({ name: 'files', type: () => [GraphQLUpload] })
    files: FileUpload[],
  ) {
    return await this.caseService.uploadCaseImages(files);
  }

  //TODO: DELETE IMAGE
  @Query(() => GetCasesQuesRes)
  async getCases(@Args() paginationArgs: PaginationArgs) {
    const { page, limit } = paginationArgs;

    return await this.caseService.getCases(
      Math.max(page, 1),
      Math.max(limit, 1),
    );
  }

  @Query(() => CaseEntity)
  async getCaseByLevel(
    @GetUser() user: UserDocument,
    @Args('userUUID', { nullable: true }) userUUID: string, // Not neccessary but added to make API backward compatible
    @Args('level') level: number,
  ) {
    return await this.caseService.getCaseByLevel(level, user);
  }

  @Query(() => CaseEntity)
  async getCaseByUUID(@Args('caseUUID') caseUUID: string) {
    return await this.caseService.getCaseById(caseUUID);
  }

  @Mutation(() => CaseEntity)
  async createCase(@Args('caseInput') caseInput: CreateCaseInput) {
    return await this.caseService.create(caseInput);
  }

  @Mutation(() => CaseEntity)
  async updateCase(
    @Args('caseUUID') caseUUID: string,
    @Args('caseInput') caseInput: UpdateCaseInput,
  ) {
    return await this.caseService.update(caseUUID, caseInput);
  }

  @Mutation(() => MessageRes)
  async deleteCase(@Args('caseUUID') caseUUID: string) {
    return await this.caseService.delete(caseUUID);
  }

  @Mutation(() => MessageRes)
  async importQuestions(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
  ) {
    return await this.caseService.importQuestions(file);
  }

  @Mutation(() => SubmitCaseRes)
  async submitCaseResponse(
    @GetUser() user: UserDocument,
    @Args('submitResInput') submitResInput: SubmitCaseResInput,
  ) {
    return await this.caseService.submitResponse(user, submitResInput);
  }
}
