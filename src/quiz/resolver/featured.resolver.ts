/* eslint-disable prettier/prettier */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { MessageRes } from 'src/auth/types/auth.types';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { FeaturedEntity } from '../entity/featured.entity';
import { FeaturedService } from '../service/featured.service';
import {
  CreateFeaturedInput,
  UpdateFeaturedInput,
} from '../dto/featured.input';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Resolver()
export class FeaturedResolver {
  constructor(private readonly featuredService: FeaturedService) {}

  // Ceate features
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => FeaturedEntity)
  async createFeatured(
    @Args('createFeaturedInput') createFeaturedInput: CreateFeaturedInput,
  ) {
    return this.featuredService.createFeatured(createFeaturedInput);
  }

  // Update features
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => FeaturedEntity)
  async updateFeatured(
    @Args('updateFeaturedInput') updateFeaturedInput: UpdateFeaturedInput,
  ) {
    return this.featuredService.updateFeatured(updateFeaturedInput);
  }

  // Delete features
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => MessageRes)
  async deleteFeatured(@Args('featureUUID') featureUUID: string) {
    return this.featuredService.deleteFeatured(featureUUID);
  }

  // Get all features
  @Query(() => [FeaturedEntity])
  async getAllFeatured() {
    return this.featuredService.getAllFeatured();
  }

  // Get one features
  @Query(() => FeaturedEntity)
  async getOneFeatured(@Args('featureUUID') featureUUID: string) {
    return this.featuredService.getOneFeatured(featureUUID);
  }

  // Get featured
  @Query(() => [FeaturedEntity])
  async getWeeklyFeatured() {
    return this.featuredService.getBiWeeklyFeatured();
  }
}
