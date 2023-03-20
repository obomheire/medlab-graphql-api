import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CreateDesignationInput } from '../dto/create-designation.dto';
import { UpdateDesignationInput } from '../dto/update-designation.dto';
import { Designation } from '../entities/designation.entity';
import { DesignationService } from '../service/designation.service';

@Resolver(() => Designation)
@UseGuards(GqlAuthGuard)
export class DesignationResolver {
  constructor(private readonly designationService: DesignationService) {}

  @Mutation(() => Designation)
  createDesignation(@Args('createDesignationInput') createDesignationInput: CreateDesignationInput) {
    return this.designationService.create(createDesignationInput);
  }

  @Query(() => [Designation], { name: 'designations' })
  findAll() {
    return this.designationService.findAll();
  }

  @Query(() => Designation, { name: 'designation' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.designationService.findOne(id);
  }

  @Mutation(() => Designation)
  updateDesignation(@Args('id') id: string, @Args('updateDesignationInput') updateDesignationInput: UpdateDesignationInput) {
    return this.designationService.update(id, updateDesignationInput);
  }

  @Mutation(() => String)
  removeDesignation(@Args('id', { type: () => String }) id: string) {
    return this.designationService.remove(id);
  }
}