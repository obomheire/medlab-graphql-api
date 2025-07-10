import { CreatePlaygroundPresCategoryDto, UpdatePlaygroundPresCategoryDto } from '../dto/playgroundPres.category.dto';
import { PlaygroundPresCategoryEntity } from '../entity/playgroundPres.category';
import { PlaygroundPresCategoryService } from '../service/playgroundPres.category.service';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PlaygroundSlideAllCategoriesRes } from '../types/playground.slide.types';

@Resolver()
export class PlaygroundPresCategoryResolver {
  constructor(
    private readonly playgroundPresCategoryService: PlaygroundPresCategoryService,
  ) {}

  @Query(() => [PlaygroundPresCategoryEntity])
  async getPlaygroundPresCategories(): Promise<PlaygroundPresCategoryEntity[]> {
    return await this.playgroundPresCategoryService.getPresCategories();
  }

  @Query(() => PlaygroundPresCategoryEntity)
  async getPlaygroundPresCategory(
    @Args('categoryUUID') categoryUUID: string,
  ): Promise<PlaygroundPresCategoryEntity> {
    return await this.playgroundPresCategoryService.getPresCategory(
      categoryUUID,
    );
  }

  @Mutation(() => PlaygroundPresCategoryEntity)
  async createPlaygroundPresCategory(
    @Args('createPlaygroundPresCategoryInput')
    createPlaygroundPresCategoryInput: CreatePlaygroundPresCategoryDto,
  ): Promise<PlaygroundPresCategoryEntity> {
    return await this.playgroundPresCategoryService.createPlaygroundPresCategory(
      createPlaygroundPresCategoryInput,
    );
  }
  
  @Mutation(() => PlaygroundPresCategoryEntity)
  async addSubCategoryToCategory(
    @Args('category') category: string,
    @Args('subCategory') subCategory: string,
  ): Promise<PlaygroundPresCategoryEntity> {
    return await this.playgroundPresCategoryService.addSubCategoryToCategory(category, subCategory);
  }

  @Query(() => [PlaygroundSlideAllCategoriesRes])
  async getAllGroupedByCategoryAndSubCategory(
    @Args('page') page: number,
    @Args('limit') limit: number,
  ): Promise<PlaygroundSlideAllCategoriesRes[]> {
    return await this.playgroundPresCategoryService.getAllGroupedByCategoryAndSubCategory(page, limit);
  }

  @Query(() => [PlaygroundPresCategoryEntity])
  async getGroupedBySubCategory(
    @Args('category') category: string,
    @Args('page') page: number,
    @Args('limit') limit: number,
  ): Promise<PlaygroundPresCategoryEntity[]> {
    return await this.playgroundPresCategoryService.getGroupedBySubCategory(category, page, limit);
  }


  @Mutation(() => PlaygroundPresCategoryEntity)
  async updatePlaygroundPresCategory(
    @Args('updatePlaygroundPresCategoryInput')
    updatePlaygroundPresCategoryInput: UpdatePlaygroundPresCategoryDto,
  ): Promise<PlaygroundPresCategoryEntity> {
    return await this.playgroundPresCategoryService.updatePresCategory(updatePlaygroundPresCategoryInput,
    );
  }

  @Mutation(() => String)
  async deletePlaygroundPresCategory(
    @Args('categoryUUID') categoryUUID: string,
  ): Promise<string> {
    return await this.playgroundPresCategoryService.deletePresCategory(categoryUUID,
    );
  }


  @Mutation(() => String)
  async addPresToCategory(
    @Args('categoryUUID') categoryUUID: string,
    @Args('presUUID') presUUID: string,
  ): Promise<string> {
    return await this.playgroundPresCategoryService.addPresToCategory(
      categoryUUID,
      presUUID,
    );
  }

  @Mutation(() => String)
  async removePresFromCategory(
    @Args('categoryUUID') categoryUUID: string,
    @Args('presUUID') presUUID: string,
  ): Promise<string> {
    return await this.playgroundPresCategoryService.removePresFromCategory(
      categoryUUID,
      presUUID,
    );
  }

  @Mutation(() => String)
  async movePresFromCategory(
    @Args('currentCategoryUUID') currentCategoryUUID: string,
    @Args('presUUID') presUUID: string,
    @Args('newCategoryUUID') newCategoryUUID: string,
  ): Promise<string> {
    return await this.playgroundPresCategoryService.movePresFromCategory(
      currentCategoryUUID,
      presUUID,
      newCategoryUUID,
    );
  }
}
