import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClinicalExamTutorialService } from '../service/clinicalExams.tutorial.service';
import { ClinicalExamTutorialEntity } from '../entity/clinicalExams.tutorial.entity';
import { GetTutorialByCatNameRes, UploadTutorialArticleRes } from '../types/clinicalExams.types';
import {
  AddTutorialSectionQuizDto,
  IncomingTutorialInput,
} from '../dto/tutorial.dto';
import { TutorialStatus } from '../enum/clinicalExam.enum';
import { UserDocument } from 'src/user/entity/user.entity';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UserQuizScoreEntity } from 'src/quiz/entity/userQuizScoreEntity';
import { UserScoreType } from 'src/quiz/enum/quiz.enum';
import {
  UserScoreTutorialInput,
} from 'src/quiz/dto/userScore.input';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';

@Resolver()
export class ClinicalExamTutorialResolver {
  constructor(
    private readonly clinicalExamTutorialService: ClinicalExamTutorialService,
  ) {}

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ClinicalExamTutorialEntity)
  async createClinicalExamTutorial(
    @Args('category') category: string,
    @Args('sectionTitle') sectionTitle: string,
  ): Promise<ClinicalExamTutorialEntity> {
    return this.clinicalExamTutorialService.createClinicalExamTutorial(
      category,
      sectionTitle,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => UploadTutorialArticleRes)
  async addTutorialSectionNoteAndVideo(
    @Args('categoryName') categoryName: string, //this is the category name
    @Args('sectionTitle') sectionTitle: string, //this is the section title
    @Args('title') title: string, //this is the title of the section
    @Args('videoUrl') videoUrl: string, //this is the video url for the section
    @Args('note') note: string, //this is the note for the section
  ) {
    return await this.clinicalExamTutorialService.addTutorialSectionNoteAndVideo(
      categoryName,
      sectionTitle,
      title,
      note,
      videoUrl,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ClinicalExamTutorialEntity)
  async addTutorialSectionQuiz(
    @Args('payload') payload: AddTutorialSectionQuizDto,
  ) {
    return await this.clinicalExamTutorialService.addTutorialSectionQuiz(
      payload,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ClinicalExamTutorialEntity)
  async addTutorialSectionArticleSlide(
    @Args('category') category: string,
    @Args('sectionTitle') sectionTitle: string,
    @Args('subSectionTitle') subSectionTitle: string,
    @Args('slides', { type: () => [String] }) slides: string[],
  ) {
    return await this.clinicalExamTutorialService.addTutorialSectionArticleSlide(
      category,
      sectionTitle,
      subSectionTitle,
      slides,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ClinicalExamTutorialEntity)
  async saveUpcomingTutorial(
    @Args('upcomingTutorialInput') upcomingTutorialInput: IncomingTutorialInput,
  ) {
    return await this.clinicalExamTutorialService.saveUpcomingTutorial(
      upcomingTutorialInput,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => String)
  async deleteUpcomingTutorial(
    @Args('tutorialUUID') tutorialUUID: string,
    @Args('sectionTitle') sectionTitle: string,
  ) {
    return await this.clinicalExamTutorialService.deleteUpcomingTutorial(
      tutorialUUID,
      sectionTitle,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [ClinicalExamTutorialEntity])
  async getUpcomingTutorials() {
    return await this.clinicalExamTutorialService.getUpcomingTutorials();
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  async changeArticleReadingStatus(
    @Args('tutorialUUID') tutorialUUID: string,
    @Args('sectionTitle') sectionTitle: string,
    @Args('articleUUID') articleUUID: string,
    @GetUser() user: UserDocument,
    @Args('status') status: TutorialStatus,
  ) {
    return await this.clinicalExamTutorialService.changeArticleReadingStatus(
      tutorialUUID,
      sectionTitle,
      articleUUID,
      user,
      status,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [GetTutorialByCatNameRes])
  async getTutorialByCatName(
    @Args('category') category: string,
    @Args('status', { nullable: true }) status: TutorialStatus,
    @Args('search', { nullable: true }) search: string,
    @Args('page', { nullable: true }) page: number,
    @Args('limit', { nullable: true }) limit: number,
    @GetUser() user: UserDocument,
  ) {
    return await this.clinicalExamTutorialService.getTutorialByCatName(category, user, status, search, page, limit);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => GetTutorialByCatNameRes)
  async getTutorial(
    @Args('category') category: string,
    @Args('sectionTitle') sectionTitle: string,
    @Args('status', { nullable: true }) status: TutorialStatus,
    @Args('search', { nullable: true }) search: string,
    @GetUser() user: UserDocument,
    @Args('page', { nullable: true }) page: number,
    @Args('limit', { nullable: true }) limit: number,
  ) {
    return await this.clinicalExamTutorialService.getTutorial(
      user,
      category,
      sectionTitle,
      status,
      search,
      page,
      limit,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [UserQuizScoreEntity])
  async getUserScores(
    @GetUser() user: UserDocument,
    @Args('category', { nullable: true }) category: string,
    @Args('subcategory', { nullable: true }) subcategory: string,
    @Args('sectionTitle', { nullable: true }) sectionTitle: string,
  ) {
    return await this.clinicalExamTutorialService.getUserScores(
      user,
      category,
      subcategory,
      sectionTitle,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [UserQuizScoreEntity])
  async getUserScoreByType(
    @GetUser() user: UserDocument,
    @Args('type') type: UserScoreType,
    @Args('category', { nullable: true }) category: string,
    @Args('subcategory', { nullable: true }) subcategory: string,
    @Args('sectionTitle', { nullable: true }) sectionTitle: string,
  ) {
    return await this.clinicalExamTutorialService.getUserScoreByType(
      user,
      type,
      category,
      subcategory,
      sectionTitle,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  async saveUserQuizScore(
    @Args('userQuizPayload') userQuizPayload: UserScoreTutorialInput,
    @GetUser() user: UserDocument,
  ) {
    return await this.clinicalExamTutorialService.saveUserQuizScore(
      userQuizPayload,
      user,
    );
  }
}
