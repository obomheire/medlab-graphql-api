import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class MedSynopsisAIInput {
  @Field()
  @IsString()
  userSummary: string;

  @Field()
  @IsString()
  @IsOptional()
  completionTime?: string;

  @Field()
  @IsString()
  @IsOptional()
  assignedTime?: string;

  @Field()
  @IsString()
  summary: string;
}
