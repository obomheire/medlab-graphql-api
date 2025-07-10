import { UseGuards } from '@nestjs/common';
import {
  SetDefaultPaymDto,
  StripeCustomerDto,
} from '../dto/stripe.customer.input';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import {
  DeleteStripeCustArgs,
  GetStripeCustArgs,
  GetStripeCustsArgs,
} from 'src/quiz/dto/question.input';
import { MessageRes } from 'src/auth/types/auth.types';
import { UserDocument, UserEntity } from 'src/user/entity/user.entity';
import { StripeCustomerService } from '../service/stripe.customer.service';
import { AppType } from '../enum/sub.plan.enum';
import { DataRes } from '../types/stripe.types';

@Resolver()
export class StripeCustomerResolver {
  constructor(private readonly stripeCustomerService: StripeCustomerService) {}

  // Create stripe customer
  @Mutation(() => UserEntity)
  async createCustomer(
    @Args('stripeCustomerDto') stripeCustomerDto: StripeCustomerDto,
  ) {
    return await this.stripeCustomerService.createCustomer(stripeCustomerDto);
  }

  // Query all customers from medscroll DB
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => DataRes)
  async getStripeCustomers(@Args() { page, limit, app }: GetStripeCustsArgs) {
    return await this.stripeCustomerService.getStripeCustomers(
      app,
      page,
      limit,
    );
  }

  // Query a customer from medscroll DB
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => DataRes)
  async getStripeCustomer(
    @Args() { stripeCustomerUUID, app }: GetStripeCustArgs,
  ) {
    return await this.stripeCustomerService.getStripeCustomer(
      stripeCustomerUUID,
      app,
    );
  }

  // List all stripe customers from stripe DB
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => MessageRes)
  async listAllCustomers() {
    return await this.stripeCustomerService.listAllCustomers();
  }

  // retrieve stripe customer fro stripe DB
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => MessageRes)
  async retrieveCustomer(@Args('stripeCustomerId') stripeCustomerId: string) {
    return await this.stripeCustomerService.retrieveCustomer(stripeCustomerId);
  }

  // Delete a stripe customer (Dev Only)
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => MessageRes)
  async deleteCustomer(
    @Args() { stripeCustomerId, app }: DeleteStripeCustArgs,
  ) {
    return await this.stripeCustomerService.deleteCustomer(
      stripeCustomerId,
      app,
    );
  }

  // Delete a stripe customer (Dev Only)
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => MessageRes)
  async deleteClinExCustomer(
    @Args('stripeCustomerId') stripeCustomerId: string,
  ) {
    return await this.stripeCustomerService.deleteCustomer(
      stripeCustomerId,
      AppType.MEDSCROLL_CLINICAL_EXAMS,
    );
  }

  // Set default payment method
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => MessageRes)
  async setDefaultPaymentMethod(
    @GetUser() user: UserDocument,
    @Args() { paymentMethodId, app }: SetDefaultPaymDto,
  ) {
    return await this.stripeCustomerService.setDefaultPaymentMethod(
      user,
      paymentMethodId,
      app,
    );
  }

  // Query default payment method
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => DataRes)
  async getDefaultPaymentMethod(
    @GetUser() user: UserDocument,
    @Args('app', { nullable: true }) app: AppType,
  ) {
    return await this.stripeCustomerService.getDefaultPaymentMethod(user, app);
  }
}
