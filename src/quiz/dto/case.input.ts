import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ResponseInput } from './question.input';
import { caseResults } from 'src/user/constant/user.constant';
import { CaseResult } from 'src/user/entity/types.entity';

@InputType()
class ImageObj {
  @Field(() => String)
  url: string;

  @Field(() => String)
  caption?: string;
}

@InputType()
export class CreateCaseInput {
  @Field(() => Number)
  @IsNumber()
  level: number;

  @Field(() => String)
  @IsString()
  details: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subject: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  keywords: string;

  @Field(() => [ImageObj], { defaultValue: [] })
  images: ImageObj[];
}

@InputType()
export class UpdateCaseInput extends PartialType(CreateCaseInput) {}

@InputType()
export class SubmitCaseResInput {
  @Field(() => Number)
  readingSpeed: number; // timeSpent // Number in seconds

  // NB: wordPerMinute; // Number

  @Field(() => Number)
  level: number;

  @Field(() => [ResponseInput])
  responses: ResponseInput[];

  @Field(() => String)
  component: string;

  @Field(() => String, { nullable: true })
  region: string;
}

@ObjectType()
export class SubmitCaseRes {
  @Field(() => Number)
  totalPoints: number;

  @Field(() => Number)
  totalCorrect: number;

  @Field(() => Number)
  totalScore: number;

  @Field(() => Number, { nullable: true })
  userRanking: number;

  @Field(() => Number)
  readingSpeed: number;

  @Field(() => Number)
  totalQuestion: number;

  @Field(() => String)
  status: string;

  @Field(() => CaseResult)
  caseResults: CaseResult;
}
