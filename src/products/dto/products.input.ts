import { Field, Float, InputType, PartialType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { Type } from 'class-transformer';

@InputType()
export class CostInput {
  @Field(() => Float)
  monthly: number;

  @Field(() => Float)
  yearly: number;

  @Field(() => Float, { nullable: true })
  payPerUse?: number;
}

@InputType()
class TopUpInput {
  @Field(() => Number, { description: '1' })
  unitAmount: number;

  @Field(() => Number, { description: '1000000' })
  value: number;

  @Field(() => Float, { description: 'Amount in AUD e.g 2' })
  amount: number;
}

@InputType()
export class CreateProductInput {
  @Field(() => String)
  @IsEnum(SubPlanType)
  @IsNotEmpty()
  plan: SubPlanType;

  @Field(() => CostInput)
  @IsObject()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CostInput)
  amount: CostInput;

  @Field(() => TopUpInput)
  @IsObject()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TopUpInput)
  tokenTopUp: TopUpInput;

  @Field(() => Boolean)
  @IsBoolean()
  @IsNotEmpty()
  medicalTrivia: boolean;

  @Field(() => Boolean)
  @IsBoolean()
  @IsNotEmpty()
  generalTrivia: boolean;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  multiplayerCapacity: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  caseRecall: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  medsynopsis: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  casePresentation: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  quizAI: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  storage: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  credits: string;
}

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field(() => String)
  productUUID: string;
}
