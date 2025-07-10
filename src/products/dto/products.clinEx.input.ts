import { Field, Float, InputType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClinExPlanType } from '../enum/product.enum';

@InputType()
export class PriseInput {
  @Field(() => Float)
  monthly: number;

  @Field(() => Float)
  fourMonths: number;
}

@InputType()
export class TokensInput extends PriseInput {}

@InputType()
export class CreateClinExProdInput {
  @Field(() => String)
  @IsEnum(ClinExPlanType)
  @IsNotEmpty()
  name: ClinExPlanType;

  @Field(() => PriseInput)
  @IsObject()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PriseInput)
  price: PriseInput;

  @Field(() => Boolean)
  examOverview: boolean;

  @Field(() => String)
  lcTemplate: string;

  @Field(() => String)
  scTemplate: string;

  @Field(() => String)
  onlineTutor: string;

  @Field(() => String)
  recordCasePres: string;

  @Field(() => String)
  aiFeedback: string;

  @Field(() => TokensInput)
  @IsObject()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TokensInput)
  aiCredit: TokensInput;

  @Field(() => Boolean)
  aiLCPractice: boolean;

  @Field(() => Boolean)
  aiSCPractice: boolean;
}

@InputType()
export class UpdateClinExProdInput extends PartialType(CreateClinExProdInput) {
  @Field(() => String)
  clinExProdUUID: string;
}
