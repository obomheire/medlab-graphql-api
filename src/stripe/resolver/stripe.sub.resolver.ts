import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { StripeSubService } from '../service/subscription/stripe.sub.service';
import {
  ListSubArgs,
  StripeSubDto,
  UpdateStripeSubDto,
} from '../dto/stripe.sub.input';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MessageRes } from 'src/auth/types/auth.types';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { UserDocument, UserEntity } from 'src/user/entity/user.entity';
import { AppType } from '../enum/sub.plan.enum';
import { PermissionsType } from 'src/user/enum/user.enum';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { StripeClinExSubService } from '../service/subscription/stripe.clinEx.sub.service';
import { DataRes } from '../types/stripe.types';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Resolver()
export class StripeSubResolver {
  constructor(
    private readonly stripeSubService: StripeSubService,
    private readonly StripeClinExSubService: StripeClinExSubService,
  ) {}

  // Create subscription plan
  @Mutation(() => UserEntity)
  async createSubscription(
    @GetUser() user: UserDocument,
    @Args('stripeSubDto') stripeSubDto: StripeSubDto,
  ) {
    return await this.stripeSubService.createSubscription(user, stripeSubDto);
  }

  // Create slide subscription plan
  @Mutation(() => UserEntity)
  async createSlideSub(
    @GetUser() user: UserDocument,
    @Args('stripeSubDto') stripeSubDto: StripeSubDto,
  ) {
    return await this.stripeSubService.createSubscription(
      user,
      stripeSubDto,
      AppType.MEDSCROLL_SLIDE,
    );
  }

  // Create Clinical exam subscription plan
  @Mutation(() => UserEntity)
  async createClinExSub(
    @GetUser() user: UserDocument,
    @Args('stripeSubDto') stripeSubDto: StripeSubDto,
  ) {
    return await this.StripeClinExSubService.createClinExSub(
      user,
      stripeSubDto,
    );
  }

  // Update subscription plan
  @Mutation(() => UserEntity)
  async updateSubscription(
    @GetUser() user: UserDocument,
    @Args('updateStripeSubDto') updateStripeSubDto: UpdateStripeSubDto,
  ) {
    return await this.stripeSubService.updateSubscription(
      user,
      updateStripeSubDto,
    );
  }

  // Update subscription plan
  @Mutation(() => UserEntity)
  async updateSlideSub(
    @GetUser() user: UserDocument,
    @Args('updateStripeSubDto') updateStripeSubDto: UpdateStripeSubDto,
  ) {
    return await this.stripeSubService.updateSubscription(
      user,
      updateStripeSubDto,
      AppType.MEDSCROLL_SLIDE,
    );
  }

  // Update Clinical exam  plan
  @Mutation(() => UserEntity)
  async updateClinExSub(
    @GetUser() user: UserDocument,
    @Args('updateStripeSubDto') updateStripeSubDto: UpdateStripeSubDto,
  ) {
    return await this.StripeClinExSubService.updateClinExSub(
      user,
      updateStripeSubDto,
    );
  }

  // Cancle Medscroll subscription plan
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => UserEntity)
  async cancelSubscription(
    @GetUser() user: UserDocument,
    @Args('subscriptionId') subscriptionId: string,
  ) {
    return await this.stripeSubService.cancelSubscription(user, subscriptionId);
  }

  // Cancle Slide subscription plan
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => UserEntity)
  async cancelSlideSub(
    @GetUser() user: UserDocument,
    @Args('subscriptionId') subscriptionId: string,
  ) {
    return await this.stripeSubService.cancelSubscription(
      user,
      subscriptionId,
      AppType.MEDSCROLL_SLIDE,
    );
  }

  // Cancle Clinical Exam subscription plan
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => UserEntity)
  async cancelClinExSub(
    @GetUser() user: UserDocument,
    @Args('subscriptionId') subscriptionId: string,
  ) {
    return await this.stripeSubService.cancelSubscription(
      user,
      subscriptionId,
      AppType.MEDSCROLL_CLINICAL_EXAMS,
    );
  }

  // List all subscription by a scripe customer
  @Query(() => DataRes)
  async listAllSubscriptions(
    @GetUser() user: UserDocument,
    @Args() listSubArgs: ListSubArgs,
  ) {
    return await this.stripeSubService.listAllSubscriptions(user, listSubArgs);
  }

  // Retrieve a subscription from stripe
  @Query(() => MessageRes)
  async retrieveSubscription(@Args('stripeSubId') stripeSubId: string) {
    return await this.stripeSubService.retrieveSubscription(stripeSubId);
  }
}
