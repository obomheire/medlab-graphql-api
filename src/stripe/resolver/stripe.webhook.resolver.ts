import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { StripeWebhookService } from '../service/stripe.webhook.service';
import {
  StripeWebhookDto,
  UpdateStripeWebhookDto,
} from '../dto/stripe.webhook.input';
import { PermissionsType } from 'src/user/enum/user.enum';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DataRes } from '../types/stripe.types';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Permissions(PermissionsType.SUPER_ADMIN)
@Resolver()
export class StripeWebhookResolver {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  // Create webhook endpoint
  @Mutation(() => DataRes)
  async createWebhookEndpoint(
    @Args('stripeWebhookDto') stripeWebhookDto: StripeWebhookDto,
  ) {
    return await this.stripeWebhookService.createWebhookEndpoint(
      stripeWebhookDto,
    );
  }

  // Update webhook endpoint
  @Mutation(() => DataRes)
  async updateWebhookEndpoint(
    @Args('updateStripeWebhookDto')
    updateStripeWebhookDto: UpdateStripeWebhookDto,
  ) {
    return await this.stripeWebhookService.updateWebhookEndpoint(
      updateStripeWebhookDto,
    );
  }

  // List webhook endpoint
  @Query(() => DataRes)
  async listWebhookEndpoint() {
    return await this.stripeWebhookService.listWebhookEndpoint();
  }

  // Delete webhook endpoint
  @Query(() => DataRes)
  async deleteWebhookEndpoint(@Args('webhooId') webhooId: string) {
    return await this.stripeWebhookService.deleteWebhookEndpoint(webhooId);
  }
}

// // STRIPE EVENTS:
// 1. 'customer.subscription.created' // Occurs whenever a customer is signed up for a new plan.
// 2. 'customer.subscription.deleted' // Occurs whenever a customer’s subscription ends.
// 3. 'customer.subscription.paused' // Occurs whenever a customer’s subscription is paused.
// 4. 'customer.subscription.resumed' // Occurs whenever a customer’s subscription is no longer paused.
// 5. 'customer.subscription.updated' // Occurs whenever a subscription changes (e.g. switching from one plan to another, or changing the status from trial to active).
// 6. 'payment_intent.created' // Occurs when a new PaymentIntent is created.
// 7. 'payment_intent.succeeded' // Occurs when a PaymentIntent has successfully completed payment.
