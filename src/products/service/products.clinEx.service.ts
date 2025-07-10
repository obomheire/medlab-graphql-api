import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateClinExProdInput,
  UpdateClinExProdInput,
} from '../dto/products.clinEx.input';
import {
  ClinExamProdDocument,
  ClinExamProdEntity,
} from '../entity/products.clinEx.entity';

@Injectable()
export class ClinExamProdService {
  constructor(
    @InjectModel(ClinExamProdEntity.name)
    private readonly clinExamProdModel: Model<ClinExamProdDocument>,
  ) {}

  // Ceate product
  async createClinExProduct(
    createClinExProdInput: CreateClinExProdInput,
  ): Promise<ClinExamProdDocument> {
    try {
      return await this.clinExamProdModel.create(createClinExProdInput);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all products
  async getAllClinExProduct(): Promise<ClinExamProdDocument[]> {
    try {
      const products = await this.clinExamProdModel.find().exec();

      return products;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get one product by UUID
  async getClinExProduct(clinExProdUUID: string) {
    try {
      const product = await this.clinExamProdModel
        .findOne({ clinExProdUUID })
        .exec();

      if (!product) throw new BadRequestException('product not found!');

      return product;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upate product
  async updateClinExProduct(
    updateClinExProdInput: UpdateClinExProdInput,
  ): Promise<ClinExamProdDocument> {
    try {
      const { clinExProdUUID } = updateClinExProdInput;

      return await this.clinExamProdModel.findOneAndUpdate(
        { clinExProdUUID },
        { $set: updateClinExProdInput },
        { new: true }, // Return the updated document
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get a product from loopscripe database
  async getProductByPlan(plan: string): Promise<ClinExamProdDocument> {
    try {
      const product = await this.clinExamProdModel
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
