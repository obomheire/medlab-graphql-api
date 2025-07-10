import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

@InputType()
export class Medscroll {
  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  status: boolean;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  subcategory: string[];

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  quizUUID: string;
}

@InputType()
export class GameInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  topic: string;

  @Field({ nullable: true })
  @IsNumber()
  @Min(10)
  @IsOptional()
  totalQuestion: number;

  @Field(() => Medscroll, { nullable: true })
  @IsOptional()
  @Type(() => Medscroll)
  @ValidateNested({ each: true })
  isMedQues?: Medscroll;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayMinSize(10)
  @IsOptional()
  questionUUIDs: string[];
}
