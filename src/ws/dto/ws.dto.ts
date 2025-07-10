import { Field } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  EngagementCategory,
  EngagementType,
} from 'src/quiz/enum/engagement.enum';
import { EngageType } from 'src/quiz/enum/quiz.enum';

export class SubmitAnsDto {
  @IsString()
  @IsNotEmpty()
  questionUUID: string;

  @IsNumber()
  @IsNotEmpty()
  speed: number;

  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;
}

export class FetchQuesDto {
  @IsNotEmpty()
  @IsEnum(EngageType)
  questionType: EngageType;
}

export class FetchPreDto {
  @IsNotEmpty()
  @IsString()
  presUUID: string;
}

export class MoveSlideDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  type: string;
}

export class PresAnswerDto {
  @IsArray()
  @IsOptional()
  optionPicked?: string[];

  @IsNumber()
  score: number;

  @IsBoolean()
  isCorrect: boolean;

  @IsNumber()
  speed: number;

  @IsEnum(EngageType)
  type: EngageType;

  @IsArray()
  correctAnwser: string[];

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsString()
  question: string;

  @IsString()
  questionUUID: string;
}

export class PresGetResultDto {
  @IsString()
  questionUUID: string;

  @IsEnum(EngageType)
  type: EngageType;
}

export class CreateMessageInput {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  engagementType: string;
}

export class ReplyToMessageInput {
  @IsString()
  @IsNotEmpty()
  parentCommentUUID: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  engagementType: string;
}

// Fetch messages input
export class FetchMessagesInput {
  @IsString()
  @IsNotEmpty()
  engagementType: string;
}

export class AIRepliesInput {
  @IsString()
  message: string;

  @IsEnum(EngagementType)
  engagementType: EngagementType;

  @IsString()
  @IsOptional()
  parentCommentUUID?: string;

  @IsEnum(EngagementCategory)
  category: EngagementCategory;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  userUUID?: string;

  @IsString()
  @IsOptional()
  sender?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  id?: string;
}

export class PodcastProgressInput {
  @IsString()
  @IsNotEmpty()
  episodeUUID: string;

  @IsNumber()
  @IsNotEmpty()
  progress: number;

  @IsBoolean()
  @IsNotEmpty()
  isCompleted: boolean;
}
