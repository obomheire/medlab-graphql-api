import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SlideProductDocument,
  SlideProductEntity,
} from '../entity/products.slide.entity';
import {
  CreateSlideProductInput,
  UpdateSlideProductInput,
} from '../dto/products.slide.input';

@Injectable()
export class SlideProductService {
  constructor(
    @InjectModel(SlideProductEntity.name)
    private readonly slideProductModel: Model<SlideProductDocument>,
  ) {}

  // Ceate product
  async crateSlideProduct(
    createSlideProductInput: CreateSlideProductInput,
  ): Promise<SlideProductDocument> {
    try {
      return await this.slideProductModel.create(createSlideProductInput);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all products
  async getAllSlideProduct(): Promise<SlideProductDocument[]> {
    try {
      const products = await this.slideProductModel.find().exec();

      return products;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get one product by UUID
  async getSlideProduct(slideProductUUID: string) {
    try {
      const product = await this.slideProductModel
        .findOne({ slideProductUUID })
        .exec();

      if (!product) throw new BadRequestException('product not found!');

      return product;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upate product
  async updateSlideProduct(
    updateSlideProductInput: UpdateSlideProductInput,
  ): Promise<SlideProductDocument> {
    try {
      const { slideProductUUID } = updateSlideProductInput;

      return await this.slideProductModel.findOneAndUpdate(
        { slideProductUUID },
        { $set: updateSlideProductInput },
        { new: true }, // Return the updated document
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get a product from loopscripe database
  async getProductByPlan(plan: string): Promise<SlideProductDocument> {
    try {
      const product = await this.slideProductModel
        .findOne({ name: plan })
        .exec();

      //check if product exist
      if (!product) throw new BadRequestException('No product found');

      return product;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
