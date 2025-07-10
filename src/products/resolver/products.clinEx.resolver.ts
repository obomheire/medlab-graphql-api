import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UseGuards } from '@nestjs/common';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { ClinExamProdEntity } from '../entity/products.clinEx.entity';
import { ClinExamProdService } from '../service/products.clinEx.service';
import {
  CreateClinExProdInput,
  UpdateClinExProdInput,
} from '../dto/products.clinEx.input';

@Resolver()
export class ClinExamProdResolver {
  constructor(private readonly clinExamProdService: ClinExamProdService) {}

  // Create product
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ClinExamProdEntity)
  async createClinExProduct(
    @Args('createClinExProdInput')
    createClinExProdInput: CreateClinExProdInput,
  ) {
    return await this.clinExamProdService.createClinExProduct(
      createClinExProdInput,
    );
  }

  // Get all products
  @Query(() => [ClinExamProdEntity])
  async getAllClinExProduct() {
    return this.clinExamProdService.getAllClinExProduct();
  }

  // Get one product
  @Query(() => ClinExamProdEntity)
  async getClinExProduct(@Args('clinExProdUUID') clinExProdUUID: string) {
    return this.clinExamProdService.getClinExProduct(clinExProdUUID);
  }

  // Create product
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ClinExamProdEntity)
  async updateClinExProduct(
    @Args('updateClinExProdInput')
    updateClinExProdInput: UpdateClinExProdInput,
  ) {
    return await this.clinExamProdService.updateClinExProduct(
      updateClinExProdInput,
    );
  }
}
