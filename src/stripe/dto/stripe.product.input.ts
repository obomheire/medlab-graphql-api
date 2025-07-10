import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Field, InputType, PickType } from '@nestjs/graphql';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { ClinExPlanType } from 'src/products/enum/product.enum';

@InputType()
export class StripeProductDto {
  @Field(() => String)
  @IsEnum(SubPlanType)
  @IsNotEmpty()
  productName: SubPlanType;

  @Field(() => Number)
  amountMonthly: number;

  @Field(() => Number)
  amountYearly: number;

  @Field(() => Boolean)
  isSlideProduct: boolean;
}

@InputType()
export class UpdateStripeProductDto extends PartialType(StripeProductDto) {}

@InputType()
export class ClinExStripeProdDto extends PickType(StripeProductDto, [
  'amountMonthly',
] as const) {
  @Field(() => String)
  @IsEnum(ClinExPlanType)
  @IsNotEmpty()
  productName: ClinExPlanType;

  @Field(() => Number)
  amount4Months: number;
}
