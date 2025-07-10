/* eslint-disable prettier/prettier */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { QuizService } from '../service/quiz.service';
import {
  AddCusCatInput,
  AddQuestionInput,
  CreateOpenEndedQuizAIInput,
  CreateQuizInput,
  MedScrollOpenEndedQuizInput,
  UntimeQuizInput,
  UpdateCusCatInput,
  UpdateQuestionInput,
  UpdateQuizInput,
} from '../dto/quiz.input';
import { QuizEntity } from '../entity/quiz.entity';
import { MessageRes } from 'src/auth/types/auth.types';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import {  ObjectId } from 'mongodb';
import { TransformedData } from '../types/quiz.types';
import { CustomCat } from 'src/user/entity/types.entity';
import { QuestionEntity } from '../entity/questions.entity';
import { CreateOpenEndedQuesInput } from '../dto/question.input';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { UserDocument } from 'src/user/entity/user.entity';
import { GuestGuard } from 'src/auth/guard/guest.guard';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Resolver()
export class QuizResolver {
  constructor(private readonly quizService: QuizService) {}

  // Get quiz category for home page
  @Query(() => TransformedData)
  async getCategory(
    @GetUser('_id') userId: ObjectId) {
    return await this.quizService.getCategory(userId);
  }

  // Add custom quiz category
  @Mutation(() => MessageRes)
  async addQBQuizCategory(
    @Args('addCusCatInput') addCusCatInput: AddCusCatInput,
    @GetUser() user: UserDocument,
  ) {
    const { customCat } = addCusCatInput;
    return this.quizService.addQBQuizCategory(user, customCat);
  }

  // Get questions by category
  @Query(() => [CustomCat])
  async getQBQuizCategory(
    @Args('query', { nullable: true, description: 'Expected: hasQuestion' })
    query: string,
    @GetUser() user: UserDocument,
  ) {
    return this.quizService.getQBQuizCategory(user, query);
  }

  // Edit custom quiz category
  @Mutation(() => MessageRes)
  async editQBQuizCategory(
    @Args('updateCusCatInput') updateCusCatInput: UpdateCusCatInput,
  ) {
    const { customCatId, customCat } = updateCusCatInput;
    return this.quizService.editQBQuizCategory(customCatId, customCat);
  }

  // Ceate quiz
  @UseGuards(GuestGuard)
  @Mutation(() => QuizEntity)
  async createQuiz(
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
    @Args('createQuizInput') createQuizInput: CreateQuizInput,
    @GetUser() user: UserDocument,
  ) {
    return this.quizService.createQuiz(user, createQuizInput, file);
  }

  // Create Open ended quiz
  @Mutation(() => String)
  async uploadBulkOpenEndedQuizByAdmin(
    @Args({
      name: 'quizImagefile',
      type: () => GraphQLUpload,
      nullable: true,
    })
    quizImagefile: FileUpload,
    @Args({
      name: 'questionsFile',
      type: () => GraphQLUpload,
      nullable: true,
    })
    questionsFile: FileUpload,
    @Args('medOpenEndedQuizInput')
    medOpenEndedQuizInput: MedScrollOpenEndedQuizInput,
    @GetUser() user: UserDocument,
  ) {
    return this.quizService.uploadBulkOpenEndedQuizByAdmin(
      user,
      medOpenEndedQuizInput,
      quizImagefile,
      questionsFile,
    );
  }

  // Create Open ended quiz by admin using AI
  @Mutation(() => String)
  async generateOpenEndedAIAdminQuiz(
    @Args('createOpenEndedQuesInput')
    createOpenEndedQuesInput: CreateOpenEndedQuesInput,
  ) {
    return this.quizService.generateOpenEndedAIAdminQuiz(
      createOpenEndedQuesInput,
    );
    // return this.quizService.createOpenEndedAIAdminQuizAsync(createOpenEndedQuesInput);
  }

  // Create Open ended quiz AI
  @Mutation(() => String)
  async createOpenEndedQuizAI(
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
    @Args({ name: 'aiFile', type: () => GraphQLUpload, nullable: true })
    aiFile: FileUpload,
    @Args('createOpenEndedQuizAIInput')
    createOpenEndedQuizAIInput: CreateOpenEndedQuizAIInput,
    @GetUser() user: UserDocument,
  ) {
    return this.quizService.createOpenEndedQuizAI(
      user,
      createOpenEndedQuizAIInput,
      file,
      aiFile,
    );
  }

  // Update quiz
  @Mutation(() => QuizEntity)
  async updateQuiz(
    @GetUser() user: UserDocument,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
    @Args('updateQuizInput') updateQuizInput: UpdateQuizInput,
  ) {
    return this.quizService.updateQuiz(user, updateQuizInput, file);
  }

  // Add questions to quiz
  @Mutation(() => MessageRes)
  async addQuestionToQuiz(
    @GetUser() user: UserDocument,
    @Args('addQuestionInput') addQuestionInput: AddQuestionInput,
  ) {
    return this.quizService.addQuestionToQuiz(user, addQuestionInput);
  }

  // Update questions added to quiz
  @Mutation(() => MessageRes)
  async updateQuestionInQuiz(
    @Args('updateQuestionInput')
    updateQuestionInput: UpdateQuestionInput,
    @GetUser() user: UserDocument,
  ) {
    return this.quizService.updateQuestionInQuiz(user, updateQuestionInput);
  }

  // Delete quiz
  @Mutation(() => MessageRes)
  async deleteQuiz(
    @Args('quizUUID') quizUUID: string,
    @GetUser('_id') userId: ObjectId,
  ) {
    return this.quizService.deleteQuiz(quizUUID, userId);
  }

  // Get quiz by user
  @Query(() => [QuizEntity])
  async getAllQuiz(@GetUser('_id') userId: ObjectId) {
    return this.quizService.getAllQuiz(userId);
  }

  // Get one quiz
  @Query(() => QuizEntity)
  async getQuiz(@Args('quizUUID') quizUUID: string) {
    return this.quizService.getQuiz(quizUUID);
  }

  // Get one quiz
  @Query(() => [QuestionEntity])
  async playUntimeQuiz(
    @Args('untimeQuizInput') untimeQuizInput: UntimeQuizInput,
  ) {
    return this.quizService.playUntimeQuiz(untimeQuizInput);
  }

  // Ceate medscroll quiz
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => MessageRes)
  async createMedscrollQuiz() {
    return this.quizService.createMedscrollQuiz();
  }
}
