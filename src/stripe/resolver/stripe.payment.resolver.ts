import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import {
  AttachePaymAregsDto,
  BuyCreditDto,
  CancelPaymentDto,
  StripePaymentDto,
  UpdateSetupIntentDto,
} from '../dto/stripe.payment.input';
import { StripePaymentService } from '../service/stripe.payment.service';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MessageRes } from 'src/auth/types/auth.types';
import {
  PaymentRes,
  PaymentIntRes,
  PaymentMethodRes,
  RetrieveSetupIntRes,
  SetupIntRes,
  DataRes,
} from '../types/stripe.types';
import { UserDocument, UserEntity } from 'src/user/entity/user.entity';
import { AppType } from '../enum/sub.plan.enum';

@Resolver()
export class StripePaymentResolver {
  constructor(private readonly stripePaymentService: StripePaymentService) {}

  // Setup and save credit card without making a payment (Add payment method)
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => SetupIntRes)
  async createSetupIntent(
    @GetUser() user: UserDocument,
    @Args('paymentMethodId') paymentMethodId: string,
  ) {
    return await this.stripePaymentService.createSetupIntent(
      user,
      paymentMethodId,
    );
  }

  // Setup and save credit card without making a payment (Add payment method)
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => SetupIntRes)
  async createslideSetupIntent(
    @GetUser() user: UserDocument,
    @Args('paymentMethodId') paymentMethodId: string,
  ) {
    return await this.stripePaymentService.createSetupIntent(
      user,
      paymentMethodId,
      AppType.MEDSCROLL_SLIDE,
    );
  }

  // Confirm setup and save credit card without making a payment (Add payment method)
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => SetupIntRes)
  async confirmSetupIntent(
    @Args('updateSetupIntentDto')
    { setupIntentId, paymentMethodId }: UpdateSetupIntentDto,
  ) {
    return await this.stripePaymentService.confirmSetupIntent(
      setupIntentId,
      paymentMethodId,
    );
  }

  // Update a save credit card without making a payment (Add payment method)
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  async updateSetupIntent(
    @Args('updateSetupIntentDto')
    { setupIntentId, paymentMethodId }: UpdateSetupIntentDto,
  ) {
    return await this.stripePaymentService.updateSetupIntent(
      setupIntentId,
      paymentMethodId,
    );
  }

  // Cancel a save credit card without making a payment (Add payment method)
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => SetupIntRes)
  async cancelSetupIntent(@Args('setupIntentId') setupIntentId: string) {
    return await this.stripePaymentService.cancelSetupIntent(setupIntentId);
  }

  // List all setup intent added by a stripe custpmer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => RetrieveSetupIntRes)
  async listAllSetupIntent(@GetUser() user: UserDocument) {
    return await this.stripePaymentService.listAllSetupIntent(user);
  }

  // List all setup intent added by a stripe custpmer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => RetrieveSetupIntRes)
  async listAllSlideSetupIntent(@GetUser() user: UserDocument) {
    return await this.stripePaymentService.listAllSetupIntent(
      user,
      AppType.MEDSCROLL_SLIDE,
    );
  }

  // Retrieve a setup intent added by a stripe customer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => RetrieveSetupIntRes)
  async retrieveSetupIntent(@Args('setupIntentId') setupIntentId: string) {
    return await this.stripePaymentService.retrieveSetupIntent(setupIntentId);
  }

  // Attach payment method to a customer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => DataRes)
  async attachPaymentMethod(
    @GetUser() user: UserDocument,
    @Args() { paymentMethodId, app }: AttachePaymAregsDto,
  ) {
    return await this.stripePaymentService.attachPaymentMethod(
      user,
      paymentMethodId,
      app,
    );
  }

  // Detach payment method from a customer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => DataRes)
  async detachPaymentMethod(@Args('paymentMethodId') paymentMethodId: string) {
    return await this.stripePaymentService.detachPaymentMethod(paymentMethodId);
  }

  // List all payment methods added by a stripe customer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PaymentMethodRes)
  async listAllPaymentMethod(@GetUser() user: UserDocument) {
    return await this.stripePaymentService.listAllPaymentMethod(user);
  }

  // List all payment methods added by a stripe customer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PaymentMethodRes)
  async listAllSlidePaymentMethod(@GetUser() user: UserDocument) {
    return await this.stripePaymentService.listAllPaymentMethod(
      user,
      AppType.MEDSCROLL_SLIDE,
    );
  }

  // Retrieve a payment method added by a stripe custpmer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PaymentMethodRes)
  async retrievePaymentMethod(
    @GetUser() user: UserDocument,
    @Args('paymentMethodId') paymentMethodId: string,
  ) {
    return await this.stripePaymentService.retrievePaymentMethod(
      user,
      paymentMethodId,
    );
  }

  // Retrieve a payment method added by a stripe custpmer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PaymentMethodRes)
  async retrieveSlidePaymentMethod(
    @GetUser() user: UserDocument,
    @Args('paymentMethodId') paymentMethodId: string,
  ) {
    return await this.stripePaymentService.retrievePaymentMethod(
      user,
      paymentMethodId,
      AppType.MEDSCROLL_SLIDE,
    );
  }

  // Make stripe payment
  @Mutation(() => PaymentRes)
  async makePayment(
    @Args('stripePaymentDto')
    { email, tokenNumber, paymentMethodId }: StripePaymentDto,
  ) {
    return await this.stripePaymentService.makePayment(
      email,
      tokenNumber,
      paymentMethodId,
    );
  }

  //Buy credit
  @Mutation(() => PaymentRes)
  async slideCreditPayment(
    @Args('buyCreditDto') { email, paymentMethodId, amount }: BuyCreditDto,
  ) {
    return await this.stripePaymentService.slideCreditPayment(
      email,
      paymentMethodId,
      amount,
    );
  }

  // Confirm payment Dev Only (Payment should be confirm from the frontend)
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => MessageRes)
  async confirmPayment(@Args('paymentId') paymentId: string) {
    return await this.stripePaymentService.confirmPayment(paymentId);
  }

  // Confirm payment
  @Query(() => MessageRes)
  async verifyStripePayment(@Args('paymentId') paymentId: string) {
    return await this.stripePaymentService.verifyStripePayment(paymentId);
  }

  // Retrieve a payment made a customer
  @Query(() => PaymentIntRes)
  async retrievePayment(@Args('paymentId') paymentId: string) {
    return await this.stripePaymentService.retrievePayment(paymentId);
  }

  // List all payments maid by a customer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PaymentIntRes)
  async listAllPayment(@GetUser() user: UserDocument) {
    return await this.stripePaymentService.listAllPayment(user);
  }

  // List all payments maid by a customer
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => PaymentIntRes)
  async listAllSlidePayment(@GetUser() user: UserDocument) {
    return await this.stripePaymentService.listAllPayment(
      user,
      AppType.MEDSCROLL_SLIDE,
    );
  }

  // Cancle payments maid by a customer
  @Mutation(() => PaymentRes)
  async cancelPayment(
    @Args('cancelPaymentDto') { paymentId, cancelReason }: CancelPaymentDto,
  ) {
    return await this.stripePaymentService.cancelPayment(
      paymentId,
      cancelReason,
    );
  }

  // Get exchange rate for USD to NGN
  @Query(() => MessageRes)
  async getExchangeRate() {
    return await this.stripePaymentService.getExchangeRate();
  }
}

// Test cards
// pm_card_visa
// pm_card_mastercard
// pm_card_unionpay
// pm_card_amex
// pm_card_discover
// pm_card_diners
// pm_card_jcb
