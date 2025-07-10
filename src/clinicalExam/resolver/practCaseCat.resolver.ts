import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { PractCaseCatRes } from '../types/clinicalExams.types';
import { MessageRes } from 'src/auth/types/auth.types';
import { PractCaseCatService } from '../service/practCaseCat.service';
import {
  PractCaseCatInp,
  PractCaseCatsArgs,
  UpdatePractCaseCatInp,
} from '../dto/practCaseCat.dto';
import { PractCaseCatEntity } from '../entity/practCaseCat.entity';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Resolver()
export class PracticeCaseCatResolver {
  constructor(private readonly practCaseCatService: PractCaseCatService) {}

  // Create case category
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => PractCaseCatEntity)
  async createPractCaseCat(
    @Args('caseCategoryInp')
    caseCategoryInp: PractCaseCatInp,
  ) {
    return await this.practCaseCatService.createPractCaseCat(caseCategoryInp);
  }

  // Update case category
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => PractCaseCatEntity)
  async updatePractCaseCat(
    @Args('updateCaseCatInput')
    updateCaseCatInput: UpdatePractCaseCatInp,
  ) {
    return await this.practCaseCatService.updatePractCaseCat(
      updateCaseCatInput,
    );
  }

  // Get all case category
  @Query(() => PractCaseCatRes)
  async getPractCaseCats(
    @Args() { caseType, practCaseUUID, page, limit }: PractCaseCatsArgs,
  ) {
    return await this.practCaseCatService.getPractCaseCats(
      caseType,
      practCaseUUID,
      page || 1,
      limit || 15,
    );
  }

  // Get case category
  @Query(() => PractCaseCatEntity)
  async getPractCaseCat(@Args('practCaseCatUUID') practCaseCatUUID: string) {
    return await this.practCaseCatService.getPractCaseCat(practCaseCatUUID);
  }

  // Delete case category
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => MessageRes)
  async deletePractCaseCat(@Args('practCaseCatUUID') practCaseCatUUID: string) {
    return await this.practCaseCatService.deletePractCaseCat(practCaseCatUUID);
  }
}
