import {
  ObjectType,
  Field,
  Float,
  Int,
  ArgsType,
  PickType,
} from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Answer, Option } from 'src/quiz/entity/type.entity';
import { Thread } from '../entity/types.entity';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { UserDocument, UserEntity } from 'src/user/entity/user.entity';

@ArgsType()
export class ListMessageArgs {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  limit: number;
}

@ObjectType()
export class PromptRes {
  @Field(() => String, { nullable: true })
  question: string;

  @Field(() => [String], { nullable: true })
  options: string[];

  @Field(() => String, { nullable: true })
  answer: string;

  @Field(() => String, { nullable: true })
  answer_details: string;

  @Field(() => String, { nullable: true })
  reference: string;

  @Field(() => String, { nullable: true })
  subtopic: string;

  @Field(() => String, { nullable: true })
  topic: string;
}

@ObjectType()
export class PresPromptRes {
  @Field(() => String, { nullable: true })
  question: string;

  @Field(() => [String], { nullable: true })
  options: string[];

  @Field(() => [String], { nullable: true })
  answer: string[];

  @Field(() => String, { nullable: true })
  answer_details: string;

  @Field(() => String, { nullable: true })
  reference: string;

  @Field(() => String, { nullable: true })
  subtopic: string;

  @Field(() => String, { nullable: true })
  topic: string;

  @Field(() => String, { nullable: true })
  presQuestionUUID: string;
}

@ObjectType()
export class QuizAIRes {
  @Field(() => String, { nullable: true })
  quizUUID?: string;

  @Field(() => String, { nullable: true })
  threadId: string;

  @Field(() => [PresPromptRes], { nullable: true })
  questions: PresPromptRes[];
}

@ObjectType()
export class OpenEndedAIType extends PromptRes {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  category: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcategory: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  system: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  specialty: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  reviewed: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  comments: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  level: string;
}

@ObjectType()
export class OpenEndedReviewRes {
  @Field(() => [OpenEndedAIType])
  questions: OpenEndedAIType[];

  @Field(() => String)
  threadId: string;
}

@ObjectType()
export class OpenEndedAIRes {
  @Field(() => UserEntity)
  user: UserDocument;

  @Field(() => [OpenEndedAIType], { nullable: true })
  questions: OpenEndedAIType[];
}

@ObjectType()
export class PromptCaseRes {
  @Field(() => String, { nullable: true })
  questionUUID: string;

  @Field(() => String, { nullable: true })
  question: string;

  @Field(() => [Option], { nullable: true })
  options: Option[];

  @Field(() => Answer, { nullable: true })
  answer: Answer;

  @Field(() => String, { nullable: true })
  subtopic: string;
}

@ObjectType()
export class CasePromptRes {
  @Field(() => String, { nullable: true })
  threadId: string;

  @Field(() => String, { nullable: true })
  caseDetails: string;

  @Field(() => String, { nullable: true })
  keywords: string;

  @Field(() => Number, { nullable: true })
  level: number;

  @Field(() => Number, { nullable: true })
  totalQuestion: number;

  @Field(() => String, { nullable: true })
  subject: string;

  @Field(() => [PromptCaseRes], { nullable: true })
  questions: PromptCaseRes[];
}

@ObjectType()
export class CreateAsstRes {
  @Field(() => String, { nullable: true })
  assistantId: string;
}

@ObjectType()
export class Tool {
  @Field(() => String, { nullable: true })
  type: string;
}

@ObjectType()
export class FileSeach {
  @Field(() => [String], { nullable: true })
  vector_store_ids: string[];
}

@ObjectType()
export class ToolResource {
  @Field(() => FileSeach, { nullable: true })
  file_search: FileSeach;
}

@ObjectType()
export class ListAsstRes {
  @Field(() => String, { nullable: true })
  id: string;

  @Field(() => String, { nullable: true })
  object: string;

  @Field(() => Int, { nullable: true })
  created_at: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  model: string;

  @Field(() => String, { nullable: true })
  instructions: string;

  @Field(() => [Tool], { nullable: true })
  tools: Tool[];

  @Field(() => ToolResource, { nullable: true })
  tool_resources: ToolResource;

  // @Field(() => String, { nullable: true })
  // metadata: string;

  @Field(() => Float, { nullable: true })
  top_p?: number;

  @Field(() => Float, { nullable: true })
  temperature?: number;

  // @Field(() => String, { nullable: true })
  // response_format?: string;
}

@ObjectType()
export class Meta {
  @Field(() => String, { nullable: true })
  fileUrl: string;

  @Field(() => String, { nullable: true })
  title: string;

  prompt: string;
}

@ObjectType()
export class AssistantRes {
  @Field(() => String, { nullable: true })
  messageId: string;

  @Field(() => String, { nullable: true })
  threadId: string;

  @Field(() => String, { nullable: true })
  fileId: string;

  @Field(() => String, { nullable: true })
  role: string;

  @Field(() => String, { nullable: true })
  message: string;

  @Field(() => GraphQLJSON, { nullable: true })
  slides: { [key: string]: string };

  @Field(() => GraphQLJSON, { nullable: true })
  script: { [key: string]: string };

  @Field(() => String, { nullable: true })
  theme: string;

  @Field(() => GraphQLJSON, { nullable: true })
  data: { [key: string]: string };

  @Field(() => Meta, { nullable: true })
  metadata: Meta;
}

@ObjectType()
export class ThreadGrpRes {
  @Field(() => String)
  threadGrpUUID: string;

  @Field(() => String)
  component: string;

  @Field(() => String)
  title: string;

  @Field(() => [Thread])
  data: Thread[];
}

@ObjectType()
export class UploadFileRes {
  @Field(() => String, { nullable: true })
  file_id: string;
}

@ObjectType()
export class AssistantVSRes {
  @Field(() => [String], { nullable: true })
  fileIds: string[];

  @Field(() => String, { nullable: true })
  vs_id: string;
}

@ObjectType()
export class ClinicalExamRes extends PickType(AssistantRes, [
  'message',
] as const) {
  @Field(() => String, { nullable: true })
  speech: string;
}

@ObjectType()
export class AIgradingRes {
  @Field(() => GraphQLJSON, { nullable: true })
  aiGrading: { [key: string]: any };

  @Field(() => String, { nullable: true })
  threadId: string;
}

@ObjectType()
export class AIfeedbackRes {
  @Field(() => String, { nullable: true })
  aiFeedback: string;

  @Field(() => String, { nullable: true })
  threadId: string;
}

@ObjectType()
export class SubmitPresRes {
  @Field(() => String)
  conversationUUID: string;
}
