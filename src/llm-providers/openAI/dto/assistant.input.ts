import { InputType, Field, PickType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { SlideAssPromptType } from 'src/presentation/enum/presentation.enum';

@InputType()
export class ThreadMessageInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  threadId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  message: string;

  @Field({ nullable: true, description: 'Needed for case recall only' })
  @IsNumber()
  @IsOptional()
  level?: number; // Needed for case recall only
}

export class UpdateMessageInput extends PickType(ThreadMessageInput, [
  'message',
] as const) {
  @Field()
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  messageId: string;
}

@InputType()
export class UpdateThreadInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  description: string;
}

@InputType()
export class SlideAssInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  threadId: string;

  @Field({ nullable: true })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title: string;
  
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(SlideAssPromptType)
  promptType: SlideAssPromptType;
}

@InputType()
export class ChatAssInput {
  @Field({ nullable: true })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

@InputType()
export class GenImageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  imageNo: number;
}
