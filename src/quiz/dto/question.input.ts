import { ArgsType, Field, Float, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { IsThreeDP } from './question.input.validation';
import { TimerType } from '../enum/quiz.enum';
import { AppType } from 'src/stripe/enum/sub.plan.enum';

@InputType()
export class TopicSubtopic {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  topic: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  subtopics: string[];
}

@InputType()
export class SystemTopics {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  system: string;

  @Field(() => [TopicSubtopic], { nullable: true })
  @IsOptional()
  @IsArray()
  data: TopicSubtopic[];
}

@ArgsType()
export class QuestionArgs {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcatId: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  quizUUID: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  caseUUID: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isContinue: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;

  @Field(() => [SystemTopics], { nullable: true })
  @IsArray()
  @IsOptional()
  systems: SystemTopics[];
}

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 1, nullable: true })
  @IsNumber()
  @IsOptional()
  page: number;

  @Field(() => Int, { defaultValue: 15, nullable: true })
  @IsNumber()
  @IsOptional()
  limit: number;
}

@ArgsType()
export class GetMyQuesArgs extends PaginationArgs {
  @Field(() => String, {
    nullable: true,
    description: 'Expected: quizUUID or quizCategoryId',
  })
  @IsString()
  @IsOptional()
  quizOrCatId: string;
}

@ArgsType()
export class GetAllCaseQuestionsQuery extends PaginationArgs {
  @Field(() => String, {
    nullable: true,
    description: 'Expected: caseUUID',
  })
  @IsString()
  @IsOptional()
  caseUUID: string;
}

@ArgsType()
export class GetStripeCustsArgs extends PaginationArgs {
  @Field(() => String, {
    nullable: true,
    description: 'Expected: medscroll or medscroll_slide',
  })
  @IsEnum(AppType)
  @IsOptional()
  app: AppType;
}

@ArgsType()
export class GetStripeCustArgs {
  @Field(() => String, {
    description: 'Expected: stripeCustomerUUID',
  })
  @IsString()
  @IsNotEmpty()
  stripeCustomerUUID: string;

  @Field(() => String, {
    nullable: true,
    description: 'Expected: medscroll or medscroll_slide',
  })
  @IsEnum(AppType)
  @IsOptional()
  app: AppType;
}

@ArgsType()
export class DeleteStripeCustArgs {
  @Field(() => String, {
    description: 'Expected: stripeCustomerUUID',
  })
  @IsString()
  @IsNotEmpty()
  stripeCustomerId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Expected: medscroll or medscroll_slide',
  })
  @IsEnum(AppType)
  @IsOptional()
  app: AppType;
}

@InputType()
export class ResponseInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  questionUUID: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  answer: string;

  @Field()
  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isMissed: boolean;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Validate(IsThreeDP)
  timeTaken: number;
}

@InputType()
export class SubmitResInput {
  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsNotEmpty()
  point: number;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isQbank: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isIstantQuiz: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isUntimeQuiz: boolean;

  @Field(() => [ResponseInput])
  @IsArray()
  @IsNotEmpty()
  @Type(() => ResponseInput)
  @ValidateNested({ each: true })
  responses: ResponseInput[];

  // @Field(() => String)
  // @IsEnum(ComponentType)
  // component: ComponentType;

  @Field(() => String, { nullable: true }) // PROD
  component: string;

  @Field(() => String, { nullable: true })
  region: string;
}

@InputType()
export class OpenEndedResponseInput {
  @Field({ nullable: true })
  @IsString()
  // @IsNotEmpty()
  @IsOptional()
  questionUUID: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  expectedAnswer: string[];

  @Field(() => String)
  @IsString()
  @IsOptional()
  expectedAnswerDetails: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  userAnswer: string[];

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  mode: string;

  @Field(() => Number)
  @IsNumber()
  // @IsOptional()
  // @Validate(IsThreeDP)
  assignedTime: number;

  @Field(() => Number)
  @IsNumber()
  // @IsOptional()
  // @Validate(IsThreeDP)
  timeTaken: number;
}

@InputType()
export class SubmitOpenEndedResInput {
  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsNotEmpty()
  point: number;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isSelfGrading: boolean;

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
  timer: TimerType;

  @Field(() => String)
  component: string;
  @Field(() => String, { nullable: true })
  subComponent?: string;
  @Field(() => String, { nullable: true })
  region: string;

  @Field(() => [OpenEndedResponseInput])
  @IsArray()
  @IsNotEmpty()
  @Type(() => OpenEndedResponseInput)
  @ValidateNested({ each: true })
  responses: OpenEndedResponseInput[];
}

@InputType()
export class SubcategoryInput {
  @Field(() => String)
  id: string;

  @Field(() => String)
  subcat: string;
}

@InputType()
export class CreateOpenEndedQuesInput {
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
  condition: string;

  @Field(() => Number, { nullable: true, defaultValue: 300 })
  @IsNumber()
  @IsOptional()
  questionNo: number;
}

@InputType()
export class GetQuesToReviewInput {
  @Field(() => String)
  @IsString()
  subspecialty: string;

  @Field(() => String)
  @IsString()
  medScrollID: string;

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
export class LeaderboardInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  component?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  region?: string;
}

@InputType()
export class VoteInput {
  @Field({ nullable: true })
  @IsString()
  @IsNotEmpty()
  questionUUID: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  vote: string;
}

// @InputType()
// export class VoteInput {
//   @Field(() => [VoteInp])
//   @IsArray()
//   @IsNotEmpty()
//   @Type(() => VoteInp)
//   @ValidateNested({ each: true })
//   votes: VoteInp[];
// }
