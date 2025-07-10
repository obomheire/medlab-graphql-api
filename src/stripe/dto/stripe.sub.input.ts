import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import {
  ArgsType,
  Field,
  InputType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { AppType, ListSubType, TrialEndType } from '../enum/sub.plan.enum';

@InputType()
export class StripeSubDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  productPriceId: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subscriptionItemsId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Accepted values: now',
  })
  @IsEnum(TrialEndType)
  @IsOptional()
  trialEnd: TrialEndType; // To immediately end a trial period

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  cancelAtPeriodEnd: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  defaultPaymentMethod: string;
}

@InputType()
export class UpdateStripeSubDto extends PickType(StripeSubDto, [
  'subscriptionItemsId',
  'trialEnd',
  'cancelAtPeriodEnd',
  'defaultPaymentMethod',
] as const) {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  productPriceId: string;
}

@ArgsType()
export class ListSubArgs {
  @Field(() => String, { nullable: true })
  productPriceId?: string;

  @Field(() => Number, { nullable: true })
  limit?: number;

  @Field(() => String, {
    nullable: true,
    description:
      'Status of the subscription to be listed. Accepted all, ended or canceled. Default to all subscriptions that have not been canceled are returned.',
  })
  @IsEnum(ListSubType)
  @IsOptional()
  status?: ListSubType;

  @Field(() => String, {
    nullable: true,
    description:
      'Expected: medscroll, medscroll_slide or medscroll_clinical_exams',
  })
  @IsEnum(AppType)
  @IsOptional()
  app?: AppType;
}
