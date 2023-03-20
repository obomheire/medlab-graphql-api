import { Resolver, Query, Mutation, Args, Int, ResolveField } from '@nestjs/graphql';
import { RoleService } from '../service/role.service';
import { Role } from '../entities/role.entity';
import { CreateRoleInput } from '../dto/create-role.input';
import { UpdateRoleInput } from '../dto/update-role.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { RoleReturnDto } from '../dto/role-return.dto';

@Resolver(() => Role)
@UseGuards(GqlAuthGuard)
export class RoleResolver {
  constructor(private readonly roleService: RoleService) {}

  @Mutation(() => Role)
  createRole(@Args('createRoleInput') createRoleInput: CreateRoleInput) {
    return this.roleService.create(createRoleInput);
  }

  @Query(() => [Role], { name: 'roles' })
  findAll(@Args('search', { type: () => String, nullable: true }) search: string) {
    return this.roleService.findAll(search);
  }

  @Query(() => RoleReturnDto, { name: 'role' })
  findOne(@Args('id', { type: () => String }) id: string, @Args('search', { type: () => String, nullable: true }) search: string) {
    return this.roleService.findOne(id, search);
  }

  @Mutation(() => Role)
  updateRole(@Args('id') id: string, @Args('updateRoleInput') updateRoleInput: UpdateRoleInput) {
    return this.roleService.update(id, updateRoleInput);
  }

  @Mutation(() => String)
  removeRole(@Args('id', { type: () => String }) id: string) {
    return this.roleService.remove(id);
  }

}
