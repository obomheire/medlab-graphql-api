import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { LaborataoryService } from '../service/laborataory.service';
import { Laborataory } from '../entities/laborataory.entity';
import { CreateLaborataoryInput } from '../dto/create-laborataory.input';
import { UpdateLaborataoryInput } from '../dto/update-laborataory.input';

@Resolver(() => Laborataory)
export class LaborataoryResolver {
  constructor(private readonly laborataoryService: LaborataoryService) {}

  @Mutation(() => Laborataory)
  createLaborataory(@Args('createLaborataoryInput') createLaborataoryInput: CreateLaborataoryInput) {
    return this.laborataoryService.create(createLaborataoryInput);
  }

  @Query(() => [Laborataory], { name: 'laborataory' })
  findAll() {
    return this.laborataoryService.findAll();
  }

  @Query(() => Laborataory, { name: 'laborataory' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.laborataoryService.findOne(id);
  }

  @Mutation(() => Laborataory)
  updateLaborataory(@Args('updateLaborataoryInput') updateLaborataoryInput: UpdateLaborataoryInput) {
    return this.laborataoryService.update(updateLaborataoryInput.id, updateLaborataoryInput);
  }

  @Mutation(() => Laborataory)
  removeLaborataory(@Args('id', { type: () => Int }) id: number) {
    return this.laborataoryService.remove(id);
  }
}
