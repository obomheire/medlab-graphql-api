import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlaygroundPresCategoryEntity } from '../entity/playgroundPres.category';
import {
  CreatePlaygroundPresCategoryDto,
  UpdatePlaygroundPresCategoryDto,
} from '../dto/playgroundPres.category.dto';
import { PlaygroundPresentationService } from './playgroundPres.service';
import { PlaygroundSlideAllCategoriesRes } from '../types/playground.slide.types';

@Injectable()
export class PlaygroundPresCategoryService {
  constructor(
    @InjectModel(PlaygroundPresCategoryEntity.name)
    private readonly playgroundPresCategoryModel: Model<PlaygroundPresCategoryEntity>,
    private readonly playgroundPresService: PlaygroundPresentationService,
  ) {}

  async createPlaygroundPresCategory(
    createPlaygroundPresCategoryDto: CreatePlaygroundPresCategoryDto,
  ): Promise<PlaygroundPresCategoryEntity> {
    try {
      const playgroundPresCategory = new this.playgroundPresCategoryModel(
        createPlaygroundPresCategoryDto,
      );
      return await playgroundPresCategory.save();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async addSubCategoryToCategory(
    category: string,
    subCategory: string,
  ): Promise<PlaygroundPresCategoryEntity> {
    try {
      const foundCategory = await this.playgroundPresCategoryModel.findOne({
        category,
      });
      if (!foundCategory) {
        throw new BadRequestException('Category not found');
      }
      const foundExistingSubCategory =
        await this.playgroundPresCategoryModel.findOne({
          category,
          subCategory,
        });
      if (foundExistingSubCategory) {
        throw new BadRequestException('Sub category already exists');
      }

      const createdSubCategory = new this.playgroundPresCategoryModel({
        category,
        subCategory,
      });
      return await createdSubCategory.save();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getPresCategories(): Promise<PlaygroundPresCategoryEntity[]> {
    try {
      return await this.playgroundPresCategoryModel.find().exec();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getAllGroupedByCategoryAndSubCategory(
    page = 1,
    limit = 10,
  ): Promise<PlaygroundSlideAllCategoriesRes[]> {
    try {
      const skip = (page - 1) * limit;

      const result = await this.playgroundPresCategoryModel.aggregate([
        // 1. Populate presentations
        {
          $lookup: {
            from: 'playgroundpresentationentities',
            localField: 'presentations',
            foreignField: '_id',
            as: 'presentations',
          },
        },
        // 2. First-level group by category + subCategory
        {
          $group: {
            _id: {
              category: '$category',
              subCategory: '$subCategory',
            },
            categoryUUID: { $first: '$categoryUUID' },
            topic: { $first: '$topic' },
            presentations: { $push: '$presentations' },
          },
        },
        // 3. Flatten the nested presentations array
        {
          $project: {
            category: '$_id.category',
            subCategory: '$_id.subCategory',
            categoryUUID: 1,
            topic: 1,
            presentations: {
              $reduce: {
                input: '$presentations',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] },
              },
            },
          },
        },
        // 4. Group by category
        {
          $group: {
            _id: '$category',
            categoryUUID: { $first: '$categoryUUID' },
            subCategories: {
              $push: {
                subCategory: '$subCategory',
                topic: '$topic',
                presentations: '$presentations',
              },
            },
          },
        },
        // 5. Final projection
        {
          $project: {
            _id: 0,
            category: '$_id',
            categoryUUID: 1,
            subCategories: 1,
          },
        },
        // 6. Sort and paginate
        { $sort: { category: 1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      return result;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getGroupedBySubCategory(
    category: string,
    page = 1,
    limit = 10,
  ): Promise<PlaygroundPresCategoryEntity[]> {
    try {
      const skip = (page - 1) * limit;

      const result = await this.playgroundPresCategoryModel.aggregate([
        {
          $match: { category },
        },
        {
          $lookup: {
            from: 'playgroundpresentationentities', // verify the exact collection name
            localField: 'presentations',
            foreignField: '_id',
            as: 'presentations',
          },
        },
        { $skip: skip },
        { $limit: limit },
      ]);

      return result;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getPresCategory(
    category: string,
  ): Promise<PlaygroundPresCategoryEntity> {
    try {
      return await this.playgroundPresCategoryModel
        .findOne({ category })
        .exec();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async updatePresCategory(
    updatePlaygroundPresCategoryDto: UpdatePlaygroundPresCategoryDto,
  ): Promise<PlaygroundPresCategoryEntity> {
    try {
      const { categoryUUID, ...rest } = updatePlaygroundPresCategoryDto;
      return await this.playgroundPresCategoryModel
        .findOneAndUpdate({ categoryUUID }, rest, {
          new: true,
        })
        .exec();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Add presentation to category
  async addPresToCategory(
    categoryUUID: string,
    presUUID: string,
  ): Promise<string> {
    try {
      const foundPres = await this.playgroundPresService.getPresByUUID(
        presUUID,
      );
      await this.playgroundPresCategoryModel
        .findOneAndUpdate(
          { categoryUUID },
          { $push: { presentations: foundPres._id } },
          { new: true },
        )
        .exec();

      if (!foundPres?.isPublished) {
        foundPres.isPublished = true;
        foundPres.inReview = false;

        foundPres.markModified('isPublished');
        foundPres.markModified('inReview');
        await foundPres.save();
      }
      return 'Presentation added to category';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Remove presentation from category
  async removePresFromCategory(
    categoryUUID: string,
    presUUID: string,
  ): Promise<string> {
    try {
      const foundPres = await this.playgroundPresService.getPresByUUID(
        presUUID,
      );
      await this.playgroundPresCategoryModel
        .findOneAndUpdate(
          { categoryUUID },
          { $pull: { presentations: foundPres._id } },
          { new: true },
        )
        .exec();
      return 'Presentation removed from category';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Move presentation from category to another category
  async movePresFromCategory(
    currentCategoryUUID: string,
    presUUID: string,
    newCategoryUUID: string,
  ): Promise<string> {
    try {
      const foundPres = await this.playgroundPresService.getPresByUUID(
        presUUID,
      );
      const removedCategory = await this.playgroundPresCategoryModel
        .findOneAndUpdate(
          { categoryUUID: currentCategoryUUID },
          { $pull: { presentations: foundPres._id } },
          { new: true },
        )
        .exec();
      if (!removedCategory) {
        throw new BadRequestException('Current category not found');
      }
      const addedCategory = await this.playgroundPresCategoryModel
        .findOneAndUpdate(
          { categoryUUID: newCategoryUUID },
          { $push: { presentations: foundPres._id } },
          { new: true },
        )
        .exec();
      if (!addedCategory) {
        throw new BadRequestException('New category not found');
      }
      return 'Presentation moved successfully';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Delete category
  async deletePresCategory(categoryUUID: string): Promise<string> {
    try {
      await this.playgroundPresCategoryModel
        .findOneAndDelete({ categoryUUID })
        .exec();
      return 'Category deleted successfully';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
}
