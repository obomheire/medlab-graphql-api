import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class ScoreInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  questionUUID: string;

  @Field(() => String)
  @IsString()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsString()
  @IsArray()
  @IsOptional()
  options: string[];

  @Field(() => Number)
  @IsNumber()
  point: number;

  @Field(() => String)
  @IsString()
  answer: string;

  @Field(() => String)
  @IsString()
  answer_details: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  speed: number;

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
  sectionTitle?: string; // this is the title inside the tutorial section array

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  type: string;
}

@InputType()
export class UserScoreInput extends ScoreInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  optionSelected: string;
}

@InputType()
export class UserOpenEndedScoreInput extends ScoreInput {
  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  optionSelected: string[];
}

@InputType()
export class UserScoreTutorialInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  questionUUID: string;

  @Field(() => String)
  @IsString()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  options: string[];

  @Field(() => [String], {
    nullable: true,
    description:
      'This is the option selected by the user. NB: for open ended questions, this is an array of strings. for multiple choice questions, this is a single string inside an array',
  })
  @IsArray()
  @IsOptional()
  optionSelected: string[];

  @Field(() => Number)
  @IsNumber()
  point: number;

  @Field(() => String)
  @IsString()
  answer: string;

  @Field(() => String)
  @IsString()
  answer_details: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  speed: number;

  @Field(() => String)
  @IsString()
  category: string;

  @Field(() => String, { nullable: true, description: "This is the section title of the tutorial"})
  @IsString()
  @IsOptional()
  subcategory: string; // this is the sectionTitle of the tutorial

  @Field(() => String, { nullable: true, description: "This is the title inside the tutorial section array"})
  @IsString()
  @IsOptional()
  sectionTitle?: string; // this is the title inside the tutorial section array

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  type: string;
}
