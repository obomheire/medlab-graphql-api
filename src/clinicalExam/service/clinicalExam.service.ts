import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateClinicalExamInput } from '../dto/clinicalExam.dto';
import { ClinicalExamEntity } from '../entity/clinicalExams.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getPagination } from 'src/utilities/service/helpers.service';
import { Pagination } from 'src/quiz/types/quiz.types';
import { clinicalExamDocs } from '../constatnt/ducument.constant';

@Injectable()
export class ClinicalExamService {
  constructor(
    @InjectModel(ClinicalExamEntity.name)
    private readonly clinicalExamModel: Model<ClinicalExamEntity>,
  ) {}

  // Create clinical exam
  async createClinicalExam() {
    try {
      // return await this.clinicalExamModel.create(clinicalExamDocs);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Update clinical exam
  async updateClinicalExam(updateClinicalExamInput: UpdateClinicalExamInput) {
    try {
      const { examUUID } = updateClinicalExamInput;

      const clinicalExam = await this.clinicalExamModel.findOneAndUpdate(
        { examUUID },
        updateClinicalExamInput,
        { new: true }, // Return the updated document
      );

      if (!clinicalExam) {
        throw new BadRequestException(
          `Clinical exam with UUID ${examUUID} not found`,
        );
      }

      return clinicalExam;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all clinical exams
  async getClinicalExams(page: number, limit: number) {
    try {
      const clinicalExams = await this.clinicalExamModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.clinicalExamModel,
        {},
        clinicalExams,
        limit,
        page,
      );

      return { clinicalExams, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get clinical exam
  async getClinicalExam(examUUID: string) {
    try {
      const clinicalExam = await this.clinicalExamModel.findOne({
        examUUID,
      });

      if (!clinicalExam) {
        throw new BadRequestException(
          `Clinical exam with UUID ${examUUID} not found`,
        );
      }

      return clinicalExam;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete clinical exam
  async deleteClinicalExam(examUUID: string) {
    try {
      const clinicalExam = await this.clinicalExamModel.findOne({
        examUUID,
      });

      if (!clinicalExam) {
        throw new BadRequestException('Clinical exam not found');
      }

      await clinicalExam.deleteOne();

      return { message: 'Clinical exam deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
