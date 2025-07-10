import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PractCaseCatEntity } from '../entity/practCaseCat.entity';
import {
  PractCaseCatInp,
  UpdatePractCaseCatInp,
} from '../dto/practCaseCat.dto';
import { PractCaseService } from './practCase.serveice';
import { CaseType } from '../enum/clinicalExam.enum';
import { instructions } from '../constatnt/ducument.constant';

@Injectable()
export class PractCaseCatService {
  constructor(
    @InjectModel(PractCaseCatEntity.name)
    private readonly practCaseCatModel: Model<PractCaseCatEntity>,
    private readonly practCaseService: PractCaseService,
  ) {}

  // Create clinical exam
  async createPractCaseCat(caseCategoryInp: PractCaseCatInp) {
    try {
      const { practCaseUUID, ...rest } = caseCategoryInp;

      const { _id } = await this.practCaseService.getPractCase(practCaseUUID);

      const document: PractCaseCatEntity = {
        ...rest,
        practCaseId: _id,
      };

      return await this.practCaseCatModel.create(document);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Update clinical exam
  async updatePractCaseCat(updateCaseCatInput: UpdatePractCaseCatInp) {
    try {
      const { practCaseCatUUID } = updateCaseCatInput;

      const practCaseCat = await this.practCaseCatModel.findOneAndUpdate(
        { practCaseCatUUID },
        updateCaseCatInput,
        { new: true }, // Return the updated document
      );

      if (!practCaseCat) {
        throw new BadRequestException(
          `Case category with UUID ${practCaseCatUUID} not found`,
        );
      }

      return practCaseCat;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all pract case cats
  async getPractCaseCats(
    caseType: CaseType,
    practCaseUUID: string,
    page: number,
    limit: number,
  ) {
    try {
      const matchStage: any = {};

      // Add caseType filter if provided
      if (caseType) {
        matchStage.caseType = caseType;
      }

      // Perform lookup to join practCaseEntity and filter by practCaseUUID
      const practCaseCats = await this.practCaseCatModel.aggregate([
        {
          $lookup: {
            from: 'practcaseentities',
            localField: 'practCaseId',
            foreignField: '_id',
            as: 'practCaseId',
          },
        },
        { $unwind: '$practCaseId' },
        {
          $match: {
            'practCaseId.practCaseUUID': practCaseUUID,
            ...matchStage,
          },
        },
        {
          $addFields: {
            numericCaseNo: {
              $toInt: {
                $arrayElemAt: [{ $split: ['$caseNo', ' '] }, 1], // Extract the numeric part from Case
              },
            },
          },
        },
        { $sort: { numericCaseNo: 1 } }, // Sort by the number extracted from Case
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);

      const count = practCaseCats.length;

      const totalPages = Math.ceil(count / limit);

      const pagination = {
        totalRecords: count,
        totalPages,
        pageSize: practCaseCats.length,
        prevPage: page > 1 ? page - 1 : null,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
      };

      return { practCaseCats, pagination, instructions };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get case category
  async getPractCaseCat(practCaseCatUUID: string) {
    try {
      const practCaseCat = await this.practCaseCatModel
        .findOne({
          practCaseCatUUID,
        })
        .populate('practCaseId');

      if (!practCaseCat) {
        throw new BadRequestException(
          `Case category with UUID ${practCaseCatUUID} not found`,
        );
      }

      return practCaseCat;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete case category
  async deletePractCaseCat(practCaseCatUUID: string) {
    try {
      const practCaseCat = await this.practCaseCatModel.findOne({
        practCaseCatUUID,
      });

      if (!practCaseCat) {
        throw new BadRequestException('Case category not found');
      }

      await practCaseCat.deleteOne();

      return { message: 'Case category deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
