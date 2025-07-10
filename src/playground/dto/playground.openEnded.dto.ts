/* eslint-disable prettier/prettier */
import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';

@InputType()
export class PlaygroundQuestInput {
  @Field(() => String, { defaultValue: 'OpenAI', nullable: true })
  @IsString()
  @IsOptional()
  aiModel: string;

  @Field(() => String)
  @IsString()
  category: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcategory: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  specialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  questionType: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  section: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  questionNo: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  prompt: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  topics: string[];

  @Field(() => Boolean, { defaultValue: false })
  isGradeStrictly: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  threadId: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject: string;
}

@InputType()
export class MedSynopsisInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  categoryUUID: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  categoryTitle: string;
}

@InputType()
export class PlaygroundOpenEndedInput {
  @Field(() => String)
  @IsString()
  aiModel: string;

  @Field(() => String)
  @IsString()
  category: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  specialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;

  @Field(() => String)
  @IsString()
  questionType: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  questionNo: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  prompt: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  topics: string[];

  @Field(() => Boolean, { defaultValue: false })
  isGradeStrictly: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  threadId: string;
}

@InputType()
export class AIInput {
  @Field(() => String)
  threadId: string;

  @Field(() => String)
  prompt: string;

  @Field(() => ComponentType)
  component: ComponentType;
}

@InputType()
export class PlaygroundAddToDb extends PlaygroundOpenEndedInput {
  @Field(() => String)
  @IsString()
  quizCategory: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  questCategory: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject?: string;

  @Field(() => AIInput, { nullable: true })
  @IsOptional()
  aIPayload: AIInput;
}

@InputType()
export class PlaygroundGeneralTriviaInput {
  @Field(() => String)
  @IsString()
  aiModel: string;

  @Field(() => String)
  @IsString()
  category: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcategory: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  specialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  section?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  topics?: string[];

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  questionType: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  outline?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  template?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  sampleQuestions?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  questionNo: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  prompt: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  threadId: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject?: string;
}

@InputType()
export class GetOpeEndedQuesToReviewInput {
  @Field(() => String)
  @IsString()
  subspecialty: string;

  @Field(() => String, {
    description:
      'Input the question type. Example: Dx Quest, Med-Match, Problem List, etc.',
  })
  @IsString()
  questionType: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  page: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  limit: number;
}

@InputType()
export class PlaygroundQuesToReviewInput {
  @Field(() => String, {
    description:
      'Input the question type. Example: Basic Science, General Trivia, Medical Trivia',
  })
  @IsString()
  category: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcategory: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  specialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  questionType: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  page: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  limit: number;
}

@InputType()
export class QuestAnswer {
  @Field(() => String)
  id: string;

  @Field(() => String)
  answer: string;

  @Field(() => String, { nullable: true })
  reference: string;

  @Field(() => String, { nullable: true })
  answer_details: string;
}

@InputType()
export class QuestOption {
  @Field(() => String)
  id: string;

  @Field(() => String)
  value: string;
}

@InputType()
export class PlaygroundQuestionsUpdateInput {
  @Field(() => String)
  questionUUID?: string;

  @Field(() => String, { nullable: true })
  quizUUID?: string;

  @Field(() => String)
  question: string;

  @Field(() => Number, { nullable: true })
  questionNumber?: number;

  @Field(() => [QuestOption])
  options: QuestOption[];

  @Field(() => QuestAnswer)
  answer: QuestAnswer;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isGradeStrictly?: boolean;

  @Field(() => String, { nullable: true })
  subject?: string;

  @Field(() => String, { nullable: true })
  category?: string;

  @Field(() => String, { nullable: true })
  specialty?: string;

  @Field(() => String, { nullable: true })
  subspecialty?: string;

  @Field(() => [String], { nullable: true }) // To be removed
  topics?: string[];

  @Field(() => String, { nullable: true })
  subtopic?: string;

  @Field(() => Boolean, { nullable: true })
  reviewed?: boolean;

  @Field(() => String, { nullable: true })
  comments?: string;

  @Field(() => Number, { nullable: true })
  level?: number;
}

@InputType()
export class PlaygroundMedQuestionsUpdateInput {
  @Field(() => String)
  caseUUID: string;

  @Field(() => String, { nullable: true })
  categoryUUID: string;

  @Field(() => String)
  caseTitle: string;

  @Field(() => String)
  question: string;

  @Field(() => String)
  caseContent: string;

  @Field(() => String)
  caseSummary: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isGradeStrictly: boolean;

  @Field(() => Boolean, { nullable: true })
  reviewed: boolean;
}

@InputType()
export class PlaygroundUpdateAndDeleteInput {
  @Field(() => [PlaygroundQuestionsUpdateInput], { nullable: true })
  reviewed: PlaygroundQuestionsUpdateInput[];

  @Field(() => [PlaygroundQuestionsUpdateInput], { nullable: true })
  discarded: PlaygroundQuestionsUpdateInput[];
}

@InputType()
export class PlaygroundMedUpdateAndDeleteInput {
  @Field(() => [PlaygroundMedQuestionsUpdateInput], { nullable: true })
  reviewed: PlaygroundMedQuestionsUpdateInput[];

  @Field(() => [PlaygroundMedQuestionsUpdateInput], { nullable: true })
  discarded: PlaygroundMedQuestionsUpdateInput[];
}

export class PlaygroundMedsynopsisCaseInput {
  @Field(() => String)
  @IsString()
  caseTitle: string;

  @Field(() => String)
  @IsString()
  caseContent: string;

  @Field(() => String)
  @IsString()
  categoryUUID: string;

  @Field(() => String)
  @IsString()
  caseSummary: string;

  @Field(() => String)
  @IsString()
  question: string;
}

export class PlaygroundMedsynopsisInput extends PlaygroundMedsynopsisCaseInput {
  @Field(() => String)
  @IsString()
  categoryTitle: string;
}

@InputType()
export class PlaygroundConfigInput {
  @Field(() => String)
  @IsString()
  category: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcategory: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  specialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;
}
