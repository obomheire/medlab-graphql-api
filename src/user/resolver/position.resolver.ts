import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UseGuards } from '@nestjs/common';
import { PositionService } from '../service/position.service';
import { RoleEntity } from '../entity/role.entity';
import { SpecialtyRes, SubspecialtyRes } from '../types/user.types';

@Resolver()
export class PositionResolver {
  constructor(private readonly positionService: PositionService) {}

  // Get all roles
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [RoleEntity])
  async getAllRoles() {
    return await this.positionService.getAllRoles();
  }

  // Get all specialties
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [SpecialtyRes])
  async getAllSpecialties() {
    return await this.positionService.getAllSpecialties();
  }

  // Get all specialties
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [SubspecialtyRes])
  async getSubspecialty(@Args('specialtyUUID') specialtyUUID: string) {
    return await this.positionService.getSubspecialty(specialtyUUID);
  }
}
