import { Field, InputType, PartialType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { SubcategoryInput } from './question.input';
import { TimerType } from '../enum/quiz.enum';
import { QuestionType } from 'src/llm-providers/openAI/enum/assistantAI.enum';

@InputType()
export class CreateQuizInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  topic: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  quizCategory: string;

  @Field()
  @IsString()
  @IsOptional()
  description: string;

  @Field({
    nullable: true,
    description: 'Expected: count down per question or all time',
  })
  @IsString()
  @IsOptional()
  @IsEnum(TimerType, {
    message:
      'Timer Type must be valid enum of type count down per question or all time',
    each: true,
  })
  timer?: string;

  @Field({
    nullable: true,
    description:
      'Expected: Open ended short and long form, True or False or Multiple choice',
  })
  @IsOptional()
  @IsString()
  @IsEnum(QuestionType, {
    message:
      'questionType must be valid enum of type Open ended short and long form, multip-choice options, etc.',
    each: true,
  })
  questionType?: string;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  point: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-5]?[0-9]):([0-5]?[0-9])$/, {
    message: 'Duration must be in the format mm:ss',
  })
  duration: string;
}

@InputType()
export class MedScrollOpenEndedQuizInput {
  @Field({
    nullable: true,
    description: 'Expected: count down per question or all time',
  })
  @IsString()
  @IsOptional()
  @IsEnum(TimerType, {
    message:
      'Timer Type must be valid enum of type count down per question or all time',
    each: true,
  })
  timer: string;

  @Field({
    nullable: true,
    description:
      'Expected: Open ended short and long form, True or False or Multiple choice',
  })
  @IsOptional()
  @IsString()
  @IsEnum(QuestionType, {
    message:
      'questionType must be valid enum of type Open ended short and long form, multip-choice options, etc.',
    each: true,
  })
  questionType: string;
}

@InputType()
export class UpdateQuizInput extends PartialType(CreateQuizInput) {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  quizUUID: string;
}

@InputType()
export class AddQuestion {
  @Field()
  @IsString()
  @IsNotEmpty()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsNotEmpty()
  @ArrayUnique((val) => val, { message: 'options must be unique' })
  options: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  answer: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  answer_details: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reference: string;

  @Field({ nullable: true }) // To be removed
  @IsString()
  @IsOptional()
  topic?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subtopic: string;
}

@InputType()
export class AddPresQuestion {
  @Field()
  @IsString()
  @IsNotEmpty()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  // @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsOptional()
  @ArrayUnique((val) => val, { message: 'options must be unique' })
  options: string[];

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  answer: string[];

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  answer_details: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reference: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  presQuestionUUID?: string;

  @Field({ nullable: true }) // To be removed
  @IsString()
  @IsOptional()
  topic?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subtopic: string;
}

@InputType()
export class AddOpenEndedQuestion {
  @Field()
  @IsString()
  @IsNotEmpty()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  @ArrayUnique((val) => val, { message: 'options must be unique' })
  options?: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  answer: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  answer_details: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reference: string;

  @Field({ nullable: true }) // To be removed
  @IsString()
  @IsOptional()
  topic?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subtopic: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  level: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  specialty: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subject?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  system: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subcategory: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  comments: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  focusArea?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  section?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  competency?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  contentBreakdown?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  reviewed: boolean;

  @Field({ nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isGradeStrictly?: boolean;
}

@InputType()
export class UpdateOpenEndedQuestion {
  @Field()
  @IsString()
  @IsNotEmpty()
  questionUUID: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  quizUUID: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  @ArrayUnique((val) => val, { message: 'options must be unique' })
  options?: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  answer: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  answer_details: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reference: string;

  @Field({ nullable: true }) // To be removed
  @IsString()
  @IsOptional()
  topic?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subtopic: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  level: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subcategory: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  comments: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  reviewed: boolean;
}

@InputType()
export class AddQuestionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  quizUUID: string;

  @Field(() => [AddQuestion])
  @IsArray()
  @IsNotEmpty()
  @Type(() => AddQuestion)
  @ValidateNested({ each: true })
  questions: AddQuestion[];
}
@InputType()
export class AddOpenEndedQuestionInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  quizUUID?: string;

  @Field(() => [AddOpenEndedQuestion])
  @IsArray()
  @IsOptional()
  @Type(() => AddOpenEndedQuestion)
  @ValidateNested({ each: true })
  questions?: AddOpenEndedQuestion[];
}

@InputType()
export class OpenEndedWithAIInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  prompt: string; //

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  url: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  questionNo: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  optionNo: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subtopic?: string;
}

@InputType()
export class CreateOpenEndedQuizInput {
  @Field(() => CreateQuizInput)
  quiz?: CreateQuizInput;
}

@InputType()
export class CreateOpenEndedQuizAIInput {
  @Field(() => CreateQuizInput, { nullable: true })
  quiz?: CreateQuizInput;

  @Field(() => OpenEndedWithAIInput, { nullable: true })
  aiAssist?: OpenEndedWithAIInput;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isMedScroll?: boolean;
}

@InputType()
export class Ans {
  @Field()
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  answer: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  answer_details: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reference: string;
}

@InputType()
export class Opt {
  @Field()
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  value: string;
}

@InputType()
export class UpdateQuestion {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  questionUUID: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  caseUUID?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  quizUUID?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  imageUrls: string[];

  @Field(() => Ans)
  @IsObject()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Ans)
  answer: Ans;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  topic: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subtopic: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category: string;

  @Field(() => SubcategoryInput, { nullable: true })
  @IsOptional()
  subcategory: SubcategoryInput;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subject: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  keywords?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  level?: number;

  @Field(() => [Opt])
  @IsNotEmpty()
  @IsArray()
  @ArrayUnique((val) => val.value)
  @Type(() => Opt)
  @ValidateNested({ each: true })
  options: Opt[];
}

@InputType()
export class UpdateQuestionInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  quizUUID: string;

  @Field(() => [UpdateQuestion])
  @IsArray()
  @IsNotEmpty()
  @Type(() => UpdateQuestion)
  @ValidateNested({ each: true })
  questions: UpdateQuestion[];
}

@InputType()
export class DeleteQsImagesInput {
  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty()
  imageUrls: string[];

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  questionUUID: string;
}

@InputType()
export class AddCusCatInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  customCat: string;
}

@InputType()
export class UpdateCusCatInput extends AddCusCatInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  customCatId: string;
}

@InputType()
export class UntimeQuizInput {
  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  totalQuestion: number;

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  subcategory: string[];
}
