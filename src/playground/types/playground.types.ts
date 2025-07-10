import { Field, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Pagination } from 'src/quiz/types/quiz.types';

@ObjectType()
export class plGndGeneralTriviaRes {
  @Field(() => String)
  @IsString()
  question: string;

  @Field(() => [String])
  options: string[];

  @Field(() => String)
  @IsString()
  answer: string;

  @Field(() => String)
  @IsString()
  answer_details: string;

  @Field(() => String)
  @IsString()
  category: string;

  @Field(() => String)
  @IsString()
  subcategory: string;

  @Field(() => String)
  @IsString()
  system: string;

  @Field(() => String)
  @IsString()
  topic: string;

  @Field(() => String)
  @IsString()
  subtopic: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  level: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject: string;
}

@ObjectType()
export class playgroundPreviewResType {
  @Field(() => String)
  @IsString()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  options: string[];

  @Field(() => String)
  @IsString()
  answer: string;

  @Field(() => String)
  @IsString()
  answer_details: string;

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
  questionType: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  contentBreakdown: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  competency: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  difficulty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  keywords: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  comments: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  reference: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  system: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  topic: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subtopic: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  level: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject: string;
}

@ObjectType()
export class PlaygroundMedsynopsisRes {
  @Field(() => String)
  caseUUID: string;

  @Field(() => String)
  categoryUUID: string;

  @Field(() => Boolean)
  reviewed: boolean;

  @Field(() => Boolean)
  isGradeStrictly: boolean;

  @Field(() => String)
  caseTitle: string;

  @Field(() => String)
  question: string;

  @Field(() => String)
  caseContent: string;

  @Field(() => String)
  caseSummary: string;
}

@ObjectType()
export class PlaygroundMedsynopsisType {
  @Field(() => String)
  caseTitle: string;

  @Field(() => String)
  question: string;

  @Field(() => String)
  caseContent: string;

  @Field(() => String)
  caseSummary: string;
}

@ObjectType()
export class PlaygroundMedSynopsisReviewRes {
  @Field(() => [PlaygroundMedsynopsisType])
  questions: PlaygroundMedsynopsisType[];

  @Field(() => String)
  threadId: string;
}

@ObjectType()
export class PlaygroundReviewRes {
  @Field(() => [playgroundPreviewResType])
  questions: playgroundPreviewResType[];

  @Field(() => String)
  threadId: string;
}

@ObjectType()
export class playgroundUSMLEType {
  @Field(() => String)
  @IsString()
  question: string;

  @Field(() => [String])
  options: string[];

  @Field(() => String)
  @IsString()
  answer: string;

  @Field(() => String)
  @IsString()
  answer_details: string;

  @Field(() => String)
  @IsString()
  category: string;

  @Field(() => String)
  @IsString()
  subcategory: string;

  @Field(() => String)
  @IsString()
  system: string;

  @Field(() => String)
  @IsString()
  topic: string;

  @Field(() => String)
  @IsString()
  subtopic: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  level: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject: string;
}

@ObjectType()
export class PlaygroundUSMLERes {
  @Field(() => [playgroundUSMLEType])
  questions: playgroundUSMLEType[];

  @Field(() => String)
  threadId: string;
}

@ObjectType()
export class UnReviewedQuestionRes {
  @Field(() => [PlaygroundQuestionsUpdateRes])
  questions: PlaygroundQuestionsUpdateRes[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class UnReviewedMedQuestionRes {
  @Field(() => [PlaygroundMedsynopsisRes])
  questions: PlaygroundMedsynopsisRes[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class QuestAnswerRes {
  @Field(() => String)
  id: string;

  @Field(() => String)
  answer: string;

  @Field(() => String, { nullable: true })
  reference: string;

  @Field(() => String, { nullable: true })
  answer_details: string;
}

@ObjectType()
export class QuestOptionRes {
  @Field(() => String)
  id: string;

  @Field(() => String)
  value: string;
}

@ObjectType()
export class PlaygroundQuestionsUpdateRes {
  @Field(() => String)
  questionUUID?: string;

  @Field(() => String, { nullable: true })
  quizUUID?: string;

  @Field(() => String)
  question: string;

  @Field(() => Number, { nullable: true })
  questionNumber?: number;

  @Field(() => [QuestOptionRes])
  options: QuestOptionRes[];

  @Field(() => QuestAnswerRes)
  answer: QuestAnswerRes;

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

  @Field(() => String, { nullable: true }) // To be removed
  topic?: string;

  @Field(() => String, { nullable: true })
  subtopic?: string;

  @Field(() => Boolean, { nullable: true })
  reviewed?: boolean;

  @Field(() => String, { nullable: true })
  comments?: string;

  @Field(() => Number, { nullable: true })
  level?: number;
}


@ObjectType()
export class PlaygroundTopicsAndSubtopicsRes {
  @Field(() => String, { nullable: true })
  topic: string;

  @Field(() => [String], { nullable: true })
  subtopic: string[];
}


@ObjectType()
export class PlaygroundMasterOutlineRes {
  @Field(() => String, { nullable: true })
  system: string;

  @Field(() => [PlaygroundTopicsAndSubtopicsRes], { nullable: true })
  data: PlaygroundTopicsAndSubtopicsRes[];
}

@ObjectType()
export class PlaygroundConfigTopicRes {
  @Field(() => [PlaygroundMasterOutlineRes], { nullable: true })
  data: PlaygroundMasterOutlineRes[];

  @Field(() => String, { nullable: true })
  masterOutlineFileName: string;

  @Field(() => String, { nullable: true })
  templateFileName: string;

  @Field(() => String, { nullable: true })
  sampleQuestionFileName: string;
}