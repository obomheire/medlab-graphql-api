import { InputType, Field, PickType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from '../enum/assistantAI.enum';
import { QuizOrPollType } from 'src/presentation/enum/presentation.enum';

@InputType()
export class QuizPromptInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  threadId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  prompt: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  url?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  questionNo?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  optionNo?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({
    nullable: true,
    description: 'Expected: True or False or Multiple choice',
  })
  @IsOptional()
  @IsEnum(QuestionType, {
    message:
      'questionType must be valid enum of typeTrue or False or Multiple choice. But for presentation quiz, it can be any of the following: Open ended, MULTICHOICEhoice',
    each: true,
  })
  questionType?: string;

  @Field(() => String, {
    defaultValue: QuizOrPollType?.QUIZ,
    description: 'Accepted enum type QUIZ or POLL',
  })
  @IsOptional()
  @IsEnum(QuizOrPollType)
  type?: QuizOrPollType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  topic?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  allowMultiAnswer?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPresentation?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subtopic?: string;
}

@InputType()
export class CasePromptInput extends PickType(QuizPromptInput, [
  'prompt',
] as const) {
  @Field()
  @IsNumber()
  @IsNotEmpty()
  level: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  threadId: string;
}
