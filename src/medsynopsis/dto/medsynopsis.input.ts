/* eslint-disable prettier/prettier */
import { Field, InputType, PartialType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { MedSynopsisGameType } from '../enum/medsynopsis.enum';

@InputType()
export class MedCategoryInput {
  @Field(() => String)
  @IsString()
  title: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description: string;
}

@InputType()
export class MedsynopsisCaseInput {
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

@InputType()
export class MedScoreRecordInput {
  @Field(() => String)
  @IsString()
  caseUUID: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  completionTime: string;

  // @Field(() => String, { nullable: true, defaultValue: "15:00"})
  // @IsString()
  // @IsOptional()
  // assignedTime: string;

  @Field(()=> String)
  @IsString()
  userSummary: string

  @Field(()=> String)
  @IsString()
  categoryName: string

  @Field(()=> String, {nullable: true, defaultValue: MedSynopsisGameType.TIMED})
  @IsString()
  @IsOptional()
  gameType?: string

  // @Field(()=> String, {nullable: true})
  // @IsString()
  // @IsOptional()
  // caseSummary?: string
}


@InputType()
export class RandomMedScoreRecordInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  completionTime: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  assignedTime: string;

  @Field(()=> String)
  @IsString()
  userSummary: string

  @Field(()=> String, {nullable: true, defaultValue: MedSynopsisGameType.TIMED})
  @IsString()
  @IsOptional()
  gameType?: string
}

@InputType()
export class MedUserSummaryDetailInput {
  @Field(() => String)
  @IsString()
  caseUUID: string;

  @Field(() => String)
  @IsEnum(MedSynopsisGameType)
  gameType: string;

  @Field(() => String)
  @IsString()
  userSummary: string;

  //   @Field(()=> MedScoreRecordDto)
  //   scoreRecord: MedScoreRecordDto

  @Field(() => Number, { nullable: true })
  @IsNumber()
  assignedTime: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  completionTime: number;

  //   @Field(()=> Number)
  //   @IsNumber()
  //   score: number
}

@InputType()
export class MedSynopsisUserRecordInput {
  @Field(() => String)
  @IsString()
  categoryName: string;

  @Field(() => [MedUserSummaryDetailInput])
  content: MedUserSummaryDetailInput;

  @Field(() => Number)
  totalScore: number;
}

@InputType()
export class MedsynopsisUserInput {
  @Field(() => String)
  @IsString()
  userUUID: string;

  @Field(() => String)
  @IsString()
  caseUUID: string;

  @Field(() => String, {
    description: 'The acceptable type is either timed or untimed',
  })
  @IsString()
  gameType: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^([0-5]?[0-9]):([0-5]?[0-9])$/, {
    message: 'Assigned time must be in the format mm:ss',
  })
  assignedTime: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^([0-5]?[0-9]):([0-5]?[0-9])$/, {
    message: 'Time of completion must be in the format mm:ss',
  })
  completionTime: string;

  @Field(() => String)
  @IsString()
  categoryName: string;

  @Field(() => String)
  @IsString()
  userSummary: string;
}


@InputType()
export class UpdateMedCategoryInput extends PartialType(MedCategoryInput) {}

@InputType()
export class UpdateMedsynopsisCaseInput extends PartialType(MedsynopsisCaseInput) {}


@InputType()
export class UserCaseUploadInput{

  @Field()
  @IsString()
  userUUID: string;

  @Field({nullable: true})
  @IsString()
  @IsOptional()
  userPrompt?: string;

  @Field({nullable: true})
  @IsString()
  @IsOptional()
  threadId?: string;

  @Field({nullable: true})
  @IsString()
  @IsOptional()
  messageId?: string;
}

@InputType()
export class UpdateUserCaseUploadInput extends PartialType(UserCaseUploadInput) {}
