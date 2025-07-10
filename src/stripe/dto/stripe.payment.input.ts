import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsEmail,
  Min,
  IsDivisibleBy,
} from 'class-validator';
import { AppType, CancelSubType } from '../enum/sub.plan.enum';
import { Args, ArgsType, Field, InputType, PickType } from '@nestjs/graphql';

@InputType()
export class StripePaymentDto {
  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(1) // Ensures amount is at least 1
  tokenNumber: number; // 1 for 1M tokens, 2 for 2M tokens ... (1M tokens = 2 AUD)

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

@InputType()
export class BuyCreditDto extends PickType(StripePaymentDto, [
  'email',
  'paymentMethodId',
] as const) {
  @Field(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(5) // Ensures amount is at least 5
  @IsDivisibleBy(5) // Ensures amount is a multiple of 5
  amount: number;
}

@InputType()
export class UpdateSetupIntentDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  setupIntentId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}

@InputType()
export class CancelPaymentDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(CancelSubType, {
    message:
      'cancelReason must be valid enum of type duplicate, fraudulent, requested_by_customer, or abandoned',
    each: true,
  })
  cancelReason: CancelSubType;
}

@ArgsType()
export class AttachePaymAregsDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Expected: medscroll or medscroll_slide',
  })
  @IsEnum(AppType)
  @IsOptional()
  app: AppType;
}
