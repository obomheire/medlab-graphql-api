import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UseGuards } from '@nestjs/common';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { SlideProductService } from '../service/products.slide.service';
import { SlideProductEntity } from '../entity/products.slide.entity';
import {
  CreateSlideProductInput,
  UpdateSlideProductInput,
} from '../dto/products.slide.input';

@Resolver()
export class SlideProductResolver {
  constructor(private readonly slideProductService: SlideProductService) {}

  // Create product
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => SlideProductEntity)
  async crateSlideProduct(
    @Args('createSlideProductInput')
    createSlideProductInput: CreateSlideProductInput,
  ) {
    return await this.slideProductService.crateSlideProduct(
      createSlideProductInput,
    );
  }

  // Get all products
  @Query(() => [SlideProductEntity])
  async getAllSlideProduct() {
    return this.slideProductService.getAllSlideProduct();
  }

  // Get one product
  @Query(() => SlideProductEntity)
  async getSlideProduct(@Args('slideProductUUID') slideProductUUID: string) {
    return this.slideProductService.getSlideProduct(slideProductUUID);
  }

  // Create product
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => SlideProductEntity)
  async updateSlideProduct(
    @Args('updateSlideProductInput')
    updateSlideProductInput: UpdateSlideProductInput,
  ) {
    return await this.slideProductService.updateSlideProduct(
      updateSlideProductInput,
    );
  }
}
