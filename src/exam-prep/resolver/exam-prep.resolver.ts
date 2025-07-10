import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { ExamPrepService } from '../service/exam-prep.service';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import {
  ExamPrepConfigDto,
  ExamPrepConfigInput,
  SelectedTopics,
} from '../dto/exam-prep.input';
import { ObjectId } from 'mongoose';
import { ExamPrepLearningPathRes, QuestionsRes } from '../types/exam-prep.type';
import { LearningPathEntity } from '../entity/learningPath.entity';
import { UserDocument } from 'src/user/entity/user.entity';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class ExamPrepResolver {
  constructor(private readonly examPrepService: ExamPrepService) {}

  @Mutation(() => String)
  async createOrUpdateExamPrepConfiguration(
    @Args({ name: 'curriculumFile', type: () => GraphQLUpload, nullable: true })
    curriculumFile: FileUpload,
    @Args({ name: 'questionsFile', type: () => GraphQLUpload, nullable: true })
    questionsFile: FileUpload,
    @GetUser('userUUID') userUUID: string,
    @Args('examPrepConfigInput') examPrepConfigInput: ExamPrepConfigDto,
  ) {
    return await this.examPrepService.createOrUpdateExamPrepConfiguration(
      examPrepConfigInput,
      userUUID,
      curriculumFile,
      questionsFile,
    );
  }

  @Mutation(() => String)
  async generateExamLearningPath(@GetUser() user: UserDocument) {
    return await this.examPrepService.generateExamLearningPath(user);
  }

  @Mutation(() => QuestionsRes)
  async generateExamQuestions(
    @GetUser() user: UserDocument,
    @Args('limit', {
      description:
        'the number of questions you want the AI to generate. default is 1000',
      nullable: true,
    })
    limit: number,
    // @Args('topics', { description: 'topics areas you want to generate questions from', nullable: true }) topics: SelectedTopics,
    @Args('examLearningPathThreadId', { nullable: true })
    examLearningPathThreadId: string,
  ) {
    return await this.examPrepService.generateExamQuestions(
      user,
      examLearningPathThreadId,
      limit,
    );
  }

  @Query(() => LearningPathEntity)
  async getExamPrepLearningPath(@GetUser('userUUID') userUUID: string) {
    return await this.examPrepService.getExamPrepLearningPath(userUUID);
  }
}
