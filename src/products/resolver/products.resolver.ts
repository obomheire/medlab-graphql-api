import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProductService } from '../service/products.service';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UseGuards } from '@nestjs/common';
import { ProductEntity } from '../entity/products.entity';
import { CreateProductInput, UpdateProductInput } from '../dto/products.input';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  // Create product
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ProductEntity)
  async crateProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ) {
    return await this.productService.crateProduct(createProductInput);
  }

  // Get all products
  @Query(() => [ProductEntity])
  async getAllProduct() {
    return this.productService.getAllProduct();
  }

  // Get one product
  @Query(() => ProductEntity)
  async getProduct(@Args('productUUID') productUUID: string) {
    return this.productService.getProduct(productUUID);
  }

  // Update product
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ProductEntity)
  async updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ) {
    return await this.productService.updateProduct(updateProductInput);
  }
}
