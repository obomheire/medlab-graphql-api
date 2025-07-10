/* eslint-disable prettier/prettier */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { PlaygroundService } from '../service/playground.service';
import {
  PlaygroundConfigInput,
  PlaygroundMedUpdateAndDeleteInput,
  PlaygroundQuestInput,
  PlaygroundQuesToReviewInput,
  PlaygroundUpdateAndDeleteInput,
} from '../dto/playground.openEnded.dto';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import {
  PlaygroundConfigTopicRes,
  PlaygroundMedSynopsisReviewRes,
  PlaygroundReviewRes,
  UnReviewedMedQuestionRes,
  UnReviewedQuestionRes,
} from '../types/playground.types';
import { QuestionEntity } from 'src/quiz/entity/questions.entity';
import { PlaygroundConfigEntity } from '../entity/playgroundconfig.entity';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class PlaygroundResolver {
  constructor(private readonly playgroundService: PlaygroundService) {}

  // upload image
  @Mutation(() => String)
  async uploadImage(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
    @Args('destination')
    destination: string,
  ) {
    return await this.playgroundService.uploadImage(destination, file);
  }

  // Create questions
  @Mutation(() => String)
  async playgroundQuizAndQuestionsCreation(
    @Args('playgroundQuestInput')
    playgroundQuestInput: PlaygroundQuestInput,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
    @Args({ name: 'categoryImage', type: () => GraphQLUpload, nullable: true })
    categoryImage?: FileUpload,
    @Args({
      name: 'subcategoryImage',
      type: () => GraphQLUpload,
      nullable: true,
    })
    subcategoryImage?: FileUpload,
    @Args('categoryUUID', { nullable: true })
    categoryUUID?: string,
  ) {
    return await this.playgroundService.playgroundQuizAndQuestionsCreation(
      playgroundQuestInput,
      file,
      categoryUUID,
      categoryImage,
      subcategoryImage,
    );
  }

  // Preview  questions
  @Mutation(() => PlaygroundReviewRes)
  async playgroundQuizAndQuestionsPreview(
    @Args('playgroundQuestInput')
    playgroundQuestInput: PlaygroundQuestInput,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ) {
    return await this.playgroundService.playgroundQuizAndQuestionsPreview(
      playgroundQuestInput,
      file,
    );
  }
  @Mutation(() => [QuestionEntity])
  async groupQuestions(
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ) {
    return await this.playgroundService.groupQuestions(file);
  }

  @Mutation(() => PlaygroundMedSynopsisReviewRes)
  async playgroundMedsynopsisQuestionsPreview(
    @Args('playgroundQuestInput')
    playgroundQuestInput: PlaygroundQuestInput,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true })
    file: FileUpload,
  ) {
    return await this.playgroundService.playgroundMedsynopsisQuestionsPreview(
      playgroundQuestInput,
      file,
    );
  }

  // Get unreview questions
  @Query(() => UnReviewedQuestionRes)
  async playgroundUnreviewedQuest(
    @Args('playgroundQuesToReviewInput')
    playgroundQuesToReviewInput: PlaygroundQuesToReviewInput,
    @Args('reviewed') reviewed: boolean,
  ) {
    return await this.playgroundService.playgroundUnreviewedQuest(
      playgroundQuesToReviewInput,
      reviewed,
    );
  }

  // Get unreview questions
  @Query(() => UnReviewedMedQuestionRes)
  async playgroundMedUnreviewedQuest(
    @Args('playgroundQuesToReviewInput')
    playgroundQuesToReviewInput: PlaygroundQuesToReviewInput,
    @Args('reviewed') reviewed: boolean,
  ) {
    return await this.playgroundService.playgroundMedUnreviewedQuest(
      playgroundQuesToReviewInput,
      reviewed,
    );
  }

  // Delete or and update questions
  @Mutation(() => String)
  async PlaygroundUpdateAndDeleteQues(
    @Args('playgroundUpdateAndDeleteInput')
    playgroundUpdateAndDeleteInput: PlaygroundUpdateAndDeleteInput,
  ) {
    return await this.playgroundService.PlaygroundUpdateAndDeleteQues(
      playgroundUpdateAndDeleteInput,
    );
  }

  @Mutation(() => String)
  async PlaygroundMedUpdateAndDeleteQues(
    @Args('playgroundMedUpdateAndDeleteInput')
    playgroundMedUpdateAndDeleteInput: PlaygroundMedUpdateAndDeleteInput,
  ) {
    return await this.playgroundService.PlaygroundMedUpdateAndDeleteQues(
      playgroundMedUpdateAndDeleteInput,
    );
  }

  @Mutation(() => String)
  async createPlaygroundConfig(
    @Args('playgroundConfigInput') playgroundConfigInput: PlaygroundConfigInput,
    @Args({ name: 'masterOutline', type: () => GraphQLUpload, nullable: true })
    masterOutline?: FileUpload,
    @Args({ name: 'template', type: () => GraphQLUpload, nullable: true })
    template?: FileUpload,
    @Args({ name: 'sampleQuestion', type: () => GraphQLUpload, nullable: true })
    sampleQuestion?: FileUpload,
  ) {
    return await this.playgroundService.createPlaygroundConfig(
      playgroundConfigInput,
      masterOutline,
      template,
      sampleQuestion,
    );
  }

  
  @Query(() => [PlaygroundConfigEntity])
  async getPlaygroundConfigTopics() {
    return await this.playgroundService.getPlaygroundConfigTopics();
  }

  @Query(() => PlaygroundConfigEntity)
  async getPlaygroundConfigBySubcategory(
    @Args('subcategory') subcategory: string,
    @Args('category') category: string,
  ) {
    return await this.playgroundService.getPlaygroundConfigBySubcategory(subcategory,null, null, null, category);
  }

  @Query(() => PlaygroundConfigTopicRes)
  async getTopicsAndSubtopicsFromMasterOutline(
    @Args('category') category: string,
    @Args({name: 'subcategory', type: ()=> String, nullable: true}) subcategory: string,
    @Args({name: 'subject', type: ()=> String, nullable: true}) subject: string,
    @Args({name: 'specialty', type: ()=> String, nullable: true}) specialty: string,
    @Args({name: 'subspecialty', type: ()=> String, nullable: true}) subspecialty: string,

  ) {
    return await this.playgroundService.getTopicsAndSubtopicsFromMasterOutline(category, subcategory, subject, specialty, subspecialty);
  }
}
