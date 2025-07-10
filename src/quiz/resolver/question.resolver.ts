import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { QuestionService } from '../service/question.service';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import {
  GetAllCaseQuestionsQuery,
  GetMyQuesArgs,
  GetQuesToReviewInput,
  LeaderboardInput,
  QuestionArgs,
  SubmitResInput,
  VoteInput,
} from '../dto/question.input';
import {
  CategoryArgs,
  ClinicialSubspecialtyRes,
  GenerateOpenEndedQuesRes,
  GetMyQuesRes,
  GetQuestionsRes_v2,
  GetSystemsRes,
  MedicalExamsSubjectsRes,
  OpenEndedQuesCount,
  ReviewOpenEndedQuesRes,
  SubcategoryRes,
  SubmitQRes,
  SubmitVoteRes,
  UploadQsImageRes,
} from '../types/quiz.types';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { QuestionEntity } from '../entity/questions.entity';
import { LeaderBoardRes, PerformanceRes } from 'src/user/types/user.types';
import { MessageRes } from 'src/auth/types/auth.types';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { DeleteQsImagesInput, UpdateQuestion } from '../dto/quiz.input';
import { ObjectId } from 'mongodb';
import { UserDocument } from 'src/user/entity/user.entity';

@Resolver()
export class QuestionResolver {
  constructor(private readonly questionService: QuestionService) {}

  // Get questions by subcategory
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [SubcategoryRes])
  async getSubategory(@Args() { category }: CategoryArgs) {
    return this.questionService.getSubategory(category);
  }

  // Get questions by subcategory
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [ClinicialSubspecialtyRes])
  async getSubSpecialty(
    @Args() { category }: CategoryArgs,
    @Args({ name: 'specialty', type: () => String, nullable: true })
    specialty: string,
  ) {
    return this.questionService.getSubSpecialty(category, specialty);
  }

  // Get questions by subject
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [MedicalExamsSubjectsRes])
  async getSubCategorySubjects(
    @Args() { category }: CategoryArgs,
    @Args({ name: 'subcategory', type: () => String })
    subcategory: string,
  ) {
    return this.questionService.getSubCategorySubjects(category, subcategory);
  }

  // Get random questions from the database to play medscroll trivia quiz
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [QuestionEntity])
  async getQuestions(
    @GetUser('userUUID') userUUID: string,
    @Args()
    { subcatId, quizUUID, caseUUID, systems, subspecialty }: QuestionArgs,
  ) {
    return await this.questionService.getQuestions({
      userUUID,
      subcatId,
      quizUUID,
      caseUUID,
      systems,
      subspecialty,
    });
  }

  // Get random questions from the database to play medscroll trivia quiz
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => GetQuestionsRes_v2)
  async getQuestions_v2(
    @GetUser('userUUID') userUUID: string,
    @Args() { subcatId, quizUUID, caseUUID, systems, isContinue }: QuestionArgs,
  ) {
    return await this.questionService.getQuestions_v2({
      userUUID,
      subcatId,
      quizUUID,
      caseUUID,
      systems,
      isContinue,
    });
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [GetSystemsRes])
  async getTopics(
    @Args('subcategoryId') subcategoryId: string,
    @Args({ name: 'subspecialty', type: () => String, nullable: true })
    subspecialty: string,
    @Args({ name: 'subject', type: () => String, nullable: true })
    subject: string,
  ) {
    return await this.questionService.getTopics(
      subcategoryId,
      subspecialty,
      subject,
    );
  }

  // Get random questions from my question bank to play QB quiz
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [QuestionEntity])
  async getQuesFromQuesBank(
    @GetUser('userUUID') userUUID: string,
    @Args('quizUUID') quizUUID: string,
  ) {
    return await this.questionService.getQuesFromQuesBank(userUUID, quizUUID);
  }

  // Get random Open ended questions from my question bank to play QB quiz
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [GenerateOpenEndedQuesRes])
  async getOpenEndedQuesFromQuesBank(
    @GetUser('userUUID') userUUID: string,
    @Args('questionType', {
      description: 'should be Dx Quest, Med-Match, Problem List Evaluation',
    })
    questionType: string,
  ) {
    return await this.questionService.getOpenEndedQuesFromQuesBank(
      userUUID,
      questionType,
    );
  }

  // Get Open ended questions count
  @Query(() => [OpenEndedQuesCount])
  async getOpenEndedQuesCount() {
    return await this.questionService.getOpenEndedQuesCount();
  }

  //For Admin use only. It allows the admin to get all open ended questions that are yet to be reviewed
  @Query(() => ReviewOpenEndedQuesRes)
  async getOpenEndedQuesToReview(
    @Args('getQuesToReviewInput') getQuesToReviewInput: GetQuesToReviewInput,
  ) {
    return await this.questionService.getOpenEndedQuesToReview(
      getQuesToReviewInput,
    );
  }

  // Get all my questions or get my questions with quizUUID or quizCategory
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => GetMyQuesRes)
  async getMyQuestions(
    @Args() getMyQuesArgs: GetMyQuesArgs,
    @GetUser('_id') userId: ObjectId,
  ) {
    const { page, limit, quizOrCatId } = getMyQuesArgs;
    return await this.questionService.getMyQuestions(
      userId,
      quizOrCatId,
      Math.max(page, 1),
      Math.max(limit, 1),
    );
  }

  // Get all my questions or get my questions with quizUUID or quizCategory
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => GetMyQuesRes)
  async getAllCaseQuestions(
    @Args() { caseUUID, page, limit }: GetAllCaseQuestionsQuery,
  ) {
    return await this.questionService.getAllCaseQuestions(
      caseUUID,
      Math.max(page, 1),
      Math.max(limit, 1),
    );
  }

  // Get questions to update
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [QuestionEntity])
  async getQuesToUpdate(
    @GetUser('_id') userId: ObjectId,
    @Args('quizUUID') quizUUID: string,
  ) {
    return await this.questionService.getQuesToUpdate(userId, quizUUID);
  }

  // Delete question from quiz
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  async deleteQuestion(
    @GetUser('_id') userId: ObjectId,
    @Args('questionUUID') questionUUID: string,
  ) {
    return this.questionService.deleteQuestion(userId, questionUUID);
  }

  // Sumit response for questions
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => SubmitQRes)
  async submitResponse(
    @GetUser() user: UserDocument,
    @Args('submitResInput') submitResInput: SubmitResInput,
  ) {
    return await this.questionService.submitResponse(user, submitResInput);
  }

  // Sumit response for questions
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => SubmitVoteRes)
  async submitPollVote(
    @GetUser('userUUID') userUUID: string,
    @Args('voteInput') voteInput: VoteInput,
  ) {
    return await this.questionService.submitPollVote(userUUID, voteInput);
  }

  // Get performance
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PerformanceRes)
  async getPerformance(
    @Args('quiz', {
      defaultValue: 'trivia',
      nullable: true,
      description: 'Expected: qb',
    })
    quiz: string,
    @GetUser() user: UserDocument,
  ) {
    return await this.questionService.getPerformance(user, quiz);
  }

  // Upload images to questions
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => UploadQsImageRes)
  async uploadImageToQuestion(
    @GetUser() user: UserDocument,
    @Args({ name: 'files', type: () => [GraphQLUpload] })
    files: FileUpload[],
  ) {
    return this.questionService.uploadImageToQuestion(user, files);
  }

  // Delete images to questions
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  async deleteImageFromQuestion(
    @GetUser('_id') userId: ObjectId,
    @Args('deleteQsImagesInput')
    { imageUrls, questionUUID }: DeleteQsImagesInput,
  ) {
    return this.questionService.deleteImageFromQuestion(
      userId,
      imageUrls,
      questionUUID,
    );
  }

  // // Review answers
  // @UseGuards(AccessTokenAuthGuard)
  // @Query(() => ReviewQuesRes)
  // async reviewAnswers(@Args() paginationArgs: PaginationArgs) {
  //   const { page, limit } = paginationArgs;
  //   return await this.questionService.reviewAnswers(page, limit);
  // }

  // // Decrypt question (Dev Only)
  // @UseGuards(AccessTokenAuthGuard)
  // @Query(() => QuestionEntity)
  // async decryptQuestion(@Args('encryptedQuestion') encryptedQuestion: string) {
  //   return await this.questionService.decryptQuestion(encryptedQuestion);
  // }

  @Mutation(() => MessageRes)
  async updateQuestion(
    @Args('updateQuestionInput')
    updateQuestionInput: UpdateQuestion,
  ) {
    return this.questionService.updateQuestion(updateQuestionInput);
  }
}
