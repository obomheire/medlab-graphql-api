import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProductDocument, ProductEntity } from '../entity/products.entity';
import { Model } from 'mongoose';
import { CreateProductInput, UpdateProductInput } from '../dto/products.input';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductEntity.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  // Ceate product
  async crateProduct(
    createProductInput: CreateProductInput,
  ): Promise<ProductDocument> {
    try {
      return await this.productModel.create(createProductInput);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all products
  async getAllProduct(): Promise<ProductDocument[]> {
    try {
      const products = await this.productModel.find().exec();

      return products;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get one product by UUID
  async getProduct(productUUID: string) {
    try {
      const product = await this.productModel.findOne({ productUUID }).exec();

      if (!product) throw new BadRequestException('product not found!');

      return product;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upate product
  async updateProduct(
    updateProductInput: UpdateProductInput,
  ): Promise<ProductDocument> {
    try {
      const { productUUID } = updateProductInput;

      return await this.productModel.findOneAndUpdate(
        { productUUID },
        { $set: updateProductInput },
        { new: true }, // Return the updated document
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get a product from loopscripe database
  async getProductByPlan(plan: string): Promise<ProductDocument> {
    try {
      const product = await this.productModel.findOne({ plan }).exec();

      //check if product exist
      if (!product) throw new BadRequestException('No product found');

      return product;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
