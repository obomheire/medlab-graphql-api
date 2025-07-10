import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateFaqInput } from '../dto/clinicalExam.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getPagination } from 'src/utilities/service/helpers.service';
import { Pagination } from 'src/quiz/types/quiz.types';
import { FaqEntity } from '../entity/faq.entity';
import { faqsDocs } from '../constatnt/ducument.constant';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(FaqEntity.name)
    private readonly faqModel: Model<FaqEntity>,
  ) {}

  // Create faq
  async createFaq() {
    try {
      // return await this.faqModel.insertMany(faqsDocs);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Update faq
  async updateFaq(updateFaqInput: UpdateFaqInput) {
    try {
      const faq = await this.faqModel.findByIdAndUpdate(
        updateFaqInput.faqUUID,
        updateFaqInput,
        { new: true }, // Return the updated document
      );

      if (!faq) {
        throw new BadRequestException('Faq not found');
      }

      return faq;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Get all faqs
  async getFaqs(page: number, limit: number) {
    try {
      const faqs = await this.faqModel
        .find()
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.faqModel,
        {},
        faqs,
        limit,
        page,
      );

      return { faqs, pagination };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Get faq
  async getFaq(faqUUID: string) {
    try {
      const faq = await this.faqModel.findById(faqUUID);

      if (!faq) {
        throw new BadRequestException('Faq not found');
      }

      return faq;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Delete faq
  async deleteFaq(faqUUID: string) {
    try {
      const faq = await this.faqModel.findOne({ faqUUID });

      if (!faq) {
        throw new BadRequestException('Faq not found');
      }

      await faq.deleteOne();

      return { message: 'Faq deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
