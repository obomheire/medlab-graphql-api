import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { StripeProductService } from '../service/stripe.product.service';
import {
  ClinExStripeProdDto,
  StripeProductDto,
} from '../dto/stripe.product.input';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DataRes } from '../types/stripe.types';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Resolver()
export class StripeProductResolver {
  constructor(private readonly stripeProductService: StripeProductService) {}

  // Create Prodcuct (Plan)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => DataRes)
  async createStripeProduct(
    @Args('stripeProductDto') stripeProductDto: StripeProductDto,
  ) {
    return await this.stripeProductService.createStripeProduct(
      stripeProductDto,
    );
  }

  // Create Prodcuct (Plan)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => DataRes)
  async createClinExStripeProd(
    @Args('clinExStripeProdDto') clinExStripeProdDto: ClinExStripeProdDto,
  ) {
    return await this.stripeProductService.createClinExStripeProd(
      clinExStripeProdDto,
    );
  }

  // Get all products from stripe DB
  @Query(() => DataRes)
  async listAllStripeProducts() {
    return await this.stripeProductService.listAllStripeProducts();
  }

  // Get a product from stripe DB
  @Query(() => DataRes)
  async retrieveStripeProduct(
    @Args('stripeProductId') stripeProductId: string,
  ) {
    return await this.stripeProductService.retrieveStripeProduct(
      stripeProductId,
    );
  }
}
