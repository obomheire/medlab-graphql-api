import { InputType, Field, PickType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import {
  GenderType,
  CaseType,
  ClinicalExamPromptType,
} from 'src/clinicalExam/enum/clinicalExam.enum';

@InputType()
export class ClinicalExamInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  prompt: string;

  @Field(() => String, {
    nullable: true,
    description: 'Case 1, Case 2, Case 3, etc.',
  })
  @IsOptional()
  @IsString()
  caseNo: string;

  @Field(() => String, {
    nullable: true,
    description: 'Accepts: START_PRACTICE_CASE',
  })
  @IsOptional()
  @IsEnum(CaseType)
  caseType: CaseType;
}

@InputType()
export class InteractionInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  threadId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Accepts: Case 1, Case 2, Case 3, etc.',
  })
  @IsOptional()
  @IsString()
  caseNo: string;

  @Field(() => String, {
    nullable: true,
    description: 'Accepts: FEMALE, MALE',
  })
  @IsNotEmpty()
  @IsEnum(GenderType)
  gender: GenderType;
}

@InputType()
export class AIgradingInput {
  @Field(() => String)
  conversationUUID: string;

  @Field(() => String, {
    description: 'Accepts: SHORT_CASE, LONG_CASE',
  })
  @IsNotEmpty()
  @IsEnum(CaseType)
  caseType: CaseType;

  @Field(() => String, {
    description: 'Accepts: Case 1, Case 2, Case 3, etc.',
  })
  @Matches(/^Case \d+$/, {
    message: 'caseNo must be in the format "Case X", where X is a number.',
  })
  caseNo: string;

  @Field(() => Boolean, { nullable: true })
  isTrial = false;
}

@InputType()
export class ExamBotInput {
  @Field(() => String, {
    nullable: true,
    description: 'Optional for first call. Must be the same for short case.',
  })
  threadId: string;

  @Field(() => String, {
    description: 'Required.',
  })
  prompt: string;

  @Field(() => String, {
    nullable: true,
    description:
      'Required on first call. Accepted: Case 1, Case 2, Case 3, etc.',
  })
  caseNo: string;
}

@InputType()
export class ExaminalsSCInput extends PickType(InteractionInput, ['gender']) {
  @Field(() => String)
  threadId: string;

  @Field(() => String, {
    description: 'Accepts: START_EXAMINALS, NEXT_QUESTION',
  })
  @IsNotEmpty()
  @IsEnum(ClinicalExamPromptType)
  promptType: ClinicalExamPromptType;
}

@InputType()
export class ExaminalsLCInput extends PickType(ExaminalsSCInput, [
  'gender',
  'threadId',
]) {
  @Field(() => String, {
    nullable: true,
    description: 'Accepts: Case 1, Case 2, Case 3, etc.',
  })
  @IsOptional()
  @IsString()
  caseNo: string;

  @Field(() => String, {
    nullable: true,
    description: 'Accepts: EXAMINAL_1, EXAMINAL_2, SUBMIT_PRESENTATION',
  })
  @IsNotEmpty()
  @IsEnum(ClinicalExamPromptType)
  promptType: ClinicalExamPromptType;
}

@InputType()
export class SubmitPresInput {
  @Field(() => String)
  practCaseCatUUID: string;
}

@InputType()
export class AIFeedbackInput extends PickType(AIgradingInput, [
  'conversationUUID',
  'caseType',
]) {
  @Field(() => String)
  threadId: string;
}
