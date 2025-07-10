import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { AppType } from '../enum/sub.plan.enum';

@InputType()
export class StripeCustomerDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  email: string;

  @Field(() => String, {
    nullable: true,
    description: 'Accepted: medscroll or medscroll_slide',
  })
  @IsEnum(AppType)
  @IsOptional()
  app: AppType;
}

@InputType()
export class UpdateStripeCustomerDto extends PartialType(StripeCustomerDto) {}

@ArgsType()
export class SetDefaultPaymDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Accepted: medscroll or medscroll_slide',
  })
  @IsEnum(AppType)
  @IsOptional()
  app: AppType;
}
