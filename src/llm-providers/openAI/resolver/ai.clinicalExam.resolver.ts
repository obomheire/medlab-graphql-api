import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AIfeedbackRes, AIgradingRes, SubmitPresRes } from '../types/ai.type';
import { ClinicalExamAIService } from '../service/ai.clinicalExam.service';
import {
  AIFeedbackInput,
  AIgradingInput,
  SubmitPresInput,
} from '../dto/clinicalExam.input';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { ClinExCreditGuard } from 'src/auth/guard/clinExCredit.guard';
import { UserDocument } from 'src/user/entity/user.entity';
import { GetUser } from 'src/auth/decorator/getUser.decorator';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class ClinicalExamAIResolver {
  constructor(private readonly clinicalExamAIService: ClinicalExamAIService) {}

  // Submit presentation for short case
  @Query(() => SubmitPresRes)
  async submitPresentation(
    @GetUser() user: UserDocument,
    @Args('submitPresInput')
    { practCaseCatUUID }: SubmitPresInput,
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
  ) {
    return await this.clinicalExamAIService.submitPresentation(
      user,
      practCaseCatUUID,
      file,
    );
  }

  // Get AI grading
  @UseGuards(ClinExCreditGuard)
  @Query(() => AIgradingRes)
  async getAIgrading(
    @GetUser() user: UserDocument,
    @Args('aiGradingInput') aiGradingInput: AIgradingInput,
  ) {
    return await this.clinicalExamAIService.getAIgrading(user, aiGradingInput);
  }

  // Get AI feedback
  @UseGuards(ClinExCreditGuard)
  @Query(() => AIfeedbackRes)
  async getAIfeedback(
    @GetUser() user: UserDocument,
    @Args('aiGradingInput') aIFeedbackInput: AIFeedbackInput,
  ) {
    return await this.clinicalExamAIService.getAIfeedback(
      user,
      aIFeedbackInput,
    );
  }
}
