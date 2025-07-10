import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getPagination } from 'src/utilities/service/helpers.service';
import { Pagination } from 'src/quiz/types/quiz.types';
import { PractCaseEntity } from '../entity/practCase.entity';
import { UpdatePractCaseInput } from '../dto/practiceCase.dto';
import { practiceCaseDocs } from '../constatnt/ducument.constant';

@Injectable()
export class PractCaseService {
  constructor(
    @InjectModel(PractCaseEntity.name)
    private readonly practiceCaseModel: Model<PractCaseEntity>,
  ) {}

  // Create practice case
  async createPractCase() {
    try {
      return await this.practiceCaseModel.create(practiceCaseDocs);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Update practice case
  async updatePractCase(updatePractCaseInput: UpdatePractCaseInput) {
    try {
      const { practCaseUUID } = updatePractCaseInput;

      const practCases = await this.practiceCaseModel.findOneAndUpdate(
        { practCaseUUID },
        updatePractCaseInput,
        { new: true }, // Return the updated document
      );

      if (!practCases) {
        throw new BadRequestException(
          `Practice case with UUID ${practCaseUUID} not found`,
        );
      }

      return practCases;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all practice cases
  async getPractCases(page: number, limit: number) {
    try {
      const query = {
        isActive: true,
      };

      const practCases = await this.practiceCaseModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.practiceCaseModel,
        query,
        practCases,
        limit,
        page,
      );

      return { practCases, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get practice case
  async getPractCase(practCaseUUID: string) {
    try {
      const practCase = await this.practiceCaseModel.findOne({
        practCaseUUID,
      });

      if (!practCase) {
        throw new BadRequestException(
          `Practice case with UUID ${practCaseUUID} not found`,
        );
      }

      return practCase;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete practice case
  async deletePractCase(practCaseUUID: string) {
    try {
      const practCases = await this.practiceCaseModel.findOne({
        practCaseUUID,
      });

      if (!practCases) {
        throw new BadRequestException('Practice case not found');
      }

      await practCases.deleteOne();

      return { message: 'Practice case deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
