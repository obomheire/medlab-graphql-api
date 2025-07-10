import { InputType, Field, PartialType, Float } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { AddPresQuestion } from 'src/quiz/dto/quiz.input';
import { PresPromptType, QuizOrPollType } from '../enum/presentation.enum';
import { EngageType, PresQuizType } from 'src/quiz/enum/quiz.enum';

@InputType()
export class ProfileImgInp {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  role: string;

  @Field(() => String, { nullable: true })
  image: string;
}

@InputType()
export class PreviewInp {
  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  id: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  type: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  slideImage: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  coverImage: string;

  @Field(() => ProfileImgInp, {
    nullable: true,
  })
  @IsOptional()
  @Type(() => ProfileImgInp)
  @ValidateNested()
  profileImg: ProfileImgInp;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  title: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subTitle: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  template: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  backgroundColor: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  font: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  content?: string | Record<string, any>;

  @Field(() => [String], { nullable: true, defaultValue: [] })
  @IsArray()
  @IsOptional()
  contentUrl?: string[]; //this is for upload type

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  embedUrl?: string; //this is for embeded type

  @Field(() => [AddPresQuestion], { nullable: true })
  @IsArray()
  @IsOptional()
  @Type(() => AddPresQuestion)
  @ValidateNested({ each: true })
  questions: AddPresQuestion[];

  @Field(() => String, { nullable: true })
  @IsEnum(EngageType)
  @IsOptional()
  questionType: EngageType;

  @Field(() => String, { nullable: true })
  @IsEnum(PresQuizType)
  @IsOptional()
  quizType: PresQuizType;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  answerPoints: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  time: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  randomize: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  allowMultiAnswer: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  answerIndicator: boolean;
}

@InputType()
export class RefInp {
  @Field()
  @IsString()
  @IsOptional()
  type: string;

  @Field()
  @IsString()
  @IsOptional()
  value: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  caption: string;
}

@InputType()
export class AInfoInp {
  @Field()
  @IsString()
  @IsOptional()
  text: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  image: string;
}

@InputType()
export class AddInfoInp {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  type: string;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => AInfoInp)
  @ValidateNested()
  value: AInfoInp;
}

@InputType()
export class PresInput {
  @Field(() => String, { nullable: true })
  threadId: string;

  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => String, { nullable: true })
  subTitle: string;

  @Field(() => [PreviewInp], { nullable: true })
  @ArrayMinSize(1) // minimum 1 slide
  @IsNotEmpty()
  @Type(() => PreviewInp)
  @ValidateNested({ each: true })
  slidesPreview: PreviewInp[];

  @Field(() => [GraphQLJSONObject], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  script: Record<string, any>[];

  @Field({ nullable: true })
  note: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  theme: string; // Presentation background

  @Field({ nullable: true })
  audience: string;

  @Field({ nullable: true })
  goals: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isPublic: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isDraft: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => RefInp)
  @ValidateNested()
  reference: RefInp; // Upload input

  @Field(() => AddInfoInp, { nullable: true })
  @IsOptional()
  @Type(() => AddInfoInp)
  @ValidateNested()
  addInfo: AddInfoInp; // Additional information input
}

@InputType()
export class UpdatePresInput extends PartialType(PresInput) {
  @Field()
  @IsString()
  @IsNotEmpty()
  presUUID: string;
}

@InputType()
export class ConfigPresInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  threadId: string;

  @Field(() => String, {
    description:
      'Accepted enum type PRESENTATION_OUTLINE, PRESENTATION_NOTE, PRESENTATION_SLIDE or PRESENTATION_SCRIPT',
  })
  @IsNotEmpty()
  @IsEnum(PresPromptType)
  presPromptType: PresPromptType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subtitle: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  audience: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  goals: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  noOfSlide: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  additionalPrompt: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isUploadType: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isEmbed: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  outline: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  vignettes: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  theme: string;

  @Field({ nullable: true, defaultValue: 'OpenAI' })
  @IsOptional()
  aiModel: string;
}

@InputType()
export class PresQuizInput {
  @Field(() => String)
  threadId: string;
}

@InputType()
export class PresQuizOrPollInput {
  @Field(() => String)
  threadId: string;

  @Field(() => String, {
    defaultValue: QuizOrPollType?.QUIZ,
    description: 'Accepted enum type QUIZ or POLL',
  })
  @IsEnum(QuizOrPollType)
  type: QuizOrPollType;

  @Field(() => String, { nullable: true })
  prompt: string;
}

@InputType()
export class PresImageInput {
  @Field(() => String)
  prompt: string;

  @Field(() => Number, { nullable: true })
  slideNo: number;

  @Field(() => Number, { nullable: true })
  themeNo: number;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isTheme: boolean;

  @Field(() => String, { nullable: true })
  image: string;
}
