import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FeaturedDocument } from '../entity/featured.entity';
import { FeaturedEntity } from '../entity/featured.entity';
import {
  CreateFeaturedInput,
  UpdateFeaturedInput,
} from '../dto/featured.input';
import moment from 'moment';

@Injectable()
export class FeaturedService {
  constructor(
    @InjectModel(FeaturedEntity.name)
    private readonly featuredModel: Model<FeaturedDocument>,
  ) {}

  // Create features
  async createFeatured(
    createFeaturedInput: CreateFeaturedInput,
  ): Promise<FeaturedEntity> {
    try {
      const { title, route } = createFeaturedInput;

      const featured = await this.getByTitleAndRoute(title, route);
      if (featured) {
        throw new BadRequestException(
          'Feature with this title or route already exists',
        );
      }

      const features = new this.featuredModel(createFeaturedInput);
      return features.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update features
  async updateFeatured(
    updateFeaturedInput: UpdateFeaturedInput,
  ): Promise<FeaturedEntity> {
    try {
      const { title, route, featureUUID } = updateFeaturedInput;

      const featured = await this.getOneFeatured(featureUUID);

      if (featured.title === title || featured.route === route) {
        throw new BadRequestException(
          'Feature with this title or route already exists',
        );
      }

      return await this.featuredModel.findByIdAndUpdate(
        updateFeaturedInput.featureUUID,
        updateFeaturedInput,
        { new: true }, // Return the updated document
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete features
  async deleteFeatured(featureUUID: string): Promise<FeaturedEntity> {
    try {
      return this.featuredModel.findByIdAndDelete(featureUUID);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all features
  async getAllFeatured(): Promise<FeaturedEntity[]> {
    try {
      return this.featuredModel.find();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get features by UUID
  async getOneFeatured(featureUUID: string): Promise<FeaturedEntity> {
    try {
      const featured = await this.featuredModel.findOne({ featureUUID });

      if (!featured) {
        throw new BadRequestException('Feature not found');
      }

      return featured;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get featured by title and route
  async getByTitleAndRoute(
    title: string,
    route: string,
  ): Promise<FeaturedEntity> {
    try {
      return this.featuredModel.findOne({ $or: [{ title }, { route }] });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get weekly featured
  async getWeeklyFeatured(): Promise<FeaturedEntity[]> {
    try {
      // const currentWeek = moment().week(); // Get current week number
      const currentWeek = 4;

      const totalDocs = await this.featuredModel.countDocuments();

      // Calculate batch size (always 2 docs per week)
      const batchIndex = currentWeek % Math.ceil(totalDocs / 2);
      const skip = batchIndex * 2;

      const documents = await this.featuredModel
        .aggregate([
          { $sort: { _id: 1 } }, // Ensure a consistent sort order
          { $skip: skip },
          { $limit: 2 },
        ])
        .exec();

      // In case of odd documents, add another document if needed
      if (documents.length < 2) {
        const remainingDocs = await this.featuredModel
          .aggregate([{ $sort: { _id: 1 } }, { $limit: 2 - documents.length }])
          .exec();
        return [...documents, ...remainingDocs];
      }

      return documents;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get bi-weekly featured
  async getBiWeeklyFeatured(): Promise<FeaturedEntity[]> {
    try {
      const currentWeek = moment().week(); // Get current week number
      const biWeeklyIndex = Math.floor(currentWeek / 2); // Calculate bi-weekly index

      const totalDocs = await this.featuredModel.countDocuments();

      // Calculate batch size (always 2 docs per 2 weeks)
      const batchIndex = biWeeklyIndex % Math.ceil(totalDocs / 2);
      const skip = batchIndex * 2;

      const documents = await this.featuredModel
        .aggregate([
          { $sort: { _id: 1 } }, // Ensure a consistent sort order
          { $skip: skip },
          { $limit: 2 },
        ])
        .exec();

      // In case of odd documents, add another document if needed
      if (documents.length < 2) {
        const remainingDocs = await this.featuredModel
          .aggregate([{ $sort: { _id: 1 } }, { $limit: 2 - documents.length }])
          .exec();
        return [...documents, ...remainingDocs];
      }

      return documents;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
