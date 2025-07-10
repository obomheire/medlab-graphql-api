/* eslint-disable prettier/prettier */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { MedSynopsisService } from '../service/medsynopsis.service';
import { MedSynopsisAIService } from '../service/medsynopsisAI.service';
import {
  MedCategoryInput,
  MedScoreRecordInput,
  MedsynopsisCaseInput,
  RandomMedScoreRecordInput,
  UpdateMedCategoryInput,
  UpdateMedsynopsisCaseInput,
  UpdateUserCaseUploadInput,
} from '../dto/medsynopsis.input';
import {
  GetMedSynopsisCaseRes,
  IMedRandomQuestionRes,
  IMedSynopsisCategoryRes,
  MedSynopsisUserCaseRes,
  MedUserScoreRes,
  RandomQuestionRes,
} from '../types/medsynopsis.type';
import { MedSynopsisCaseEntity } from '../entity/medsynopsisCase.entity';
import { ObjectId } from 'mongodb';

import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { CreditControlGuard } from 'src/auth/guard/creditControl.guard';
import { MedSynopsisCategoryEntity } from '../entity/medsynopsisCatergory.entity';
import { PaginationArgs } from 'src/quiz/dto/question.input';
import { MedSynopsisUserCaseEntity } from '../entity/medsynopsisUserCase.entity';
import { UserDocument } from 'src/user/entity/user.entity';
import { GuestGuard } from 'src/auth/guard/guest.guard';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class MedSynopsisResolver {
  constructor(
    private readonly medSynopsisService: MedSynopsisService,
    private readonly medSynopsisAIService: MedSynopsisAIService,
  ) {}

  //Create MedSynopsis Category
  @Mutation(() => String)
  async AddMedSynopsisCategory(
    @Args('addMedCategoryInput') addMedCategoryInput: MedCategoryInput,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ): Promise<string> {
    return await this.medSynopsisService.addMedSynopsisCategory(
      addMedCategoryInput,
      file,
    );
  }

  //Upload a user case to be summarised
  @UseGuards(GuestGuard, CreditControlGuard)
  @Mutation(() => MedSynopsisUserCaseRes)
  async addUserMedsynopsisCase(
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
    // @Args('filePath',{description: "The file path is the name of the saved file from the first upload.", nullable: true}) filePath: string,
    @GetUser() user: UserDocument,
    @Args('userPrompt', { nullable: true }) userPrompt: string,
    @Args('threadId', { nullable: true }) threadId: string,
  ): Promise<MedSynopsisUserCaseRes> {
    return await this.medSynopsisService.addUserMedsynopsisCase(
      user,
      file,
      userPrompt,
      threadId,
    );
  }

  //Create Cases for MedSynopsis Category
  @Mutation(() => String)
  async AddMedSynopsisCase(
    @Args('medCaseInput')
    medCaseInput: MedsynopsisCaseInput,
  ): Promise<string> {
    return await this.medSynopsisService.addMedSynopsisCase(medCaseInput);
  }

  // Generate summary score
  @UseGuards(GuestGuard, CreditControlGuard)
  @Mutation(() => MedUserScoreRes)
  async generateMedCaseSummaryScore(
    @Args('medSummaryScoreInput') medSummaryScoreInput: MedScoreRecordInput,
    @Args({ name: 'threadId', nullable: true }) threadId: string,
    @GetUser() user: UserDocument,
  ): Promise<MedUserScoreRes> {
    return await this.medSynopsisAIService.generateMedSummaryScore(
      medSummaryScoreInput,
      user,
      threadId,
    );
  }

  // Generate Random summary score
  // @UseGuards(CreditControlGuard)
  @Mutation(() => RandomQuestionRes)
  async generateRandomMedSynopsisQuestions(): Promise<RandomQuestionRes> {
    return await this.medSynopsisAIService.generateRandomMedSynopsisQuestions();
  }

  //Get random questions
  @Query(() => IMedRandomQuestionRes)
  async getMedsynopsisCaseByCat(
    @Args('categoryUUID') categoryUUID: string,
    @GetUser('userUUID') userUUID: string,
  ): Promise<IMedRandomQuestionRes> {
    return await this.medSynopsisService.getMedsynopsisCaseByCat(
      userUUID,
      categoryUUID,
    );
  }

  //Get MedSynopsis case by caseUUID
  @Query(() => MedSynopsisCaseEntity)
  async getMedsynopsisCaseByUUID(
    @Args('caseUUID') caseUUID: string,
  ): Promise<MedSynopsisCaseEntity> {
    return await this.medSynopsisService.getMedsynopsisCaseByUUID(caseUUID);
  }

  // Get all MedSynopsis Categories
  @Query(() => [IMedSynopsisCategoryRes])
  async getMedsynopsisCategories(): Promise<MedSynopsisCategoryEntity[]> {
    return await this.medSynopsisService.getAllMedCategories();
  }

  //Get All Cases
  @Query(() => GetMedSynopsisCaseRes)
  async getMedsynopsisCases(@Args() getMedSynopsisCasesArgs: PaginationArgs) {
    const { page, limit } = getMedSynopsisCasesArgs;
    return await this.medSynopsisService.getMedsynopsisCases(
      Math.max(page, 1),
      Math.max(limit, 1),
    );
  }

  //Update MedSynopsis Category by categoryUUID
  @Mutation(() => String)
  async UpdateMedSynopsisCategory(
    @Args('categoryUUID') categoryUUID: string,
    @Args('updateMedCategoryInput')
    updateMedCategoryInput: UpdateMedCategoryInput,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ): Promise<string> {
    return await this.medSynopsisService.updateMedSynopsisCategory(
      categoryUUID,
      updateMedCategoryInput,
      file,
    );
  }

  //Delete MedSynopsis Category by UUID
  @Mutation(() => String)
  async DeleteMedSynopsisCategory(
    @Args('categoryUUID') categoryUUID: string,
  ): Promise<string> {
    return await this.medSynopsisService.deleteMedSynopsisCategory(
      categoryUUID,
    );
  }

  //Update MedSynopsis Case
  @Mutation(() => String)
  async UpdateMedSynopsisCase(
    @Args('caseUUID') caseUUID: string,
    @Args('updateMedCaseInput')
    updateMedCaseInput: UpdateMedsynopsisCaseInput,
  ): Promise<string> {
    return await this.medSynopsisService.updateMedSynopsisCase(
      caseUUID,
      updateMedCaseInput,
    );
  }

  //Delete MedSynopsis Case by UUID
  @Mutation(() => String)
  async DeleteMedSynopsisCase(
    @Args('caseUUID') caseUUID: string,
  ): Promise<string> {
    return await this.medSynopsisService.deleteMedSynopsisCase(caseUUID);
  }

  // section for handling user uploaded cases
  @Query(() => [MedSynopsisUserCaseEntity])
  async getAllUserUploadedMedCase(
    @GetUser('userUUID') userUUID: string,
  ): Promise<MedSynopsisUserCaseEntity[]> {
    return await this.medSynopsisService.getAllUserUploadedMedCase(userUUID);
  }

  @Query(() => MedSynopsisUserCaseEntity, { nullable: true })
  async getUserUploadedMedCaseByCaseId(
    @GetUser('userUUID') userUUID: string,
    @Args('caseID') caseID: string,
  ): Promise<MedSynopsisUserCaseEntity> {
    return await this.medSynopsisService.getUserUploadedMedCaseByCaseId(
      userUUID,
      caseID,
    );
  }

  @Query(() => [MedSynopsisUserCaseEntity])
  async getAllUploadUsersMedCases(): Promise<MedSynopsisUserCaseEntity[]> {
    return await this.medSynopsisService.getAllUploadUsersMedCases();
  }

  @UseGuards(GuestGuard, CreditControlGuard)
  @Mutation(() => MedSynopsisUserCaseEntity, { nullable: true })
  async updateUserUploadedMedCaseById(
    @GetUser() user: UserDocument,
    @Args('caseID') caseID: string,
    @Args('updateData') updateData: UpdateUserCaseUploadInput,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ): Promise<MedSynopsisUserCaseEntity | null> {
    return await this.medSynopsisService.updateUserUploadedMedCaseById(
      user,
      caseID,
      updateData,
      file,
    );
  }

  @Mutation(() => String)
  async deleteUserUploadedMedCaseById(
    @GetUser('userUUID') userUUID: string,
    @Args('caseID') caseID: string,
  ): Promise<string> {
    return await this.medSynopsisService.deleteUserUploadedMedCaseById(
      userUUID,
      caseID,
    );
  }
}
