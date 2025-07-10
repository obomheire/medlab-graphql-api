import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import Stripe from 'stripe';
import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class StripeWebhookDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  url: string;

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  enabled_events: Stripe.WebhookEndpointCreateParams.EnabledEvent[];
}

@InputType()
export class UpdateStripeWebhookDto extends PartialType(StripeWebhookDto) {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  webhooId: string;
}
