/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import ShortUniqueId from 'short-unique-id';
import {
  MedSynopsisCategoryDocument,
  MedSynopsisCategoryEntity,
} from '../entity/medsynopsisCatergory.entity';
import { Model } from 'mongoose';
import {
  MedCategoryInput,
  MedsynopsisCaseInput,
  UserCaseUploadInput,
} from '../dto/medsynopsis.input';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import {
  GetMedSynopsisCaseRes,
  IMedRandomQuestionRes,
  MedSynopsisUserCaseRes,
} from '../types/medsynopsis.type';
import {
  MedSynopsisUserScoreDocument,
  MedSynopsisUserScoreEntity,
} from '../entity/medsynopsisUserScore.entity';
import {
  MedSynopsisCaseDocument,
  MedSynopsisCaseEntity,
} from '../entity/medsynopsisCase.entity';
import { UserService } from 'src/user/service/user.service';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import path, { extname } from 'path';
import { MedSynopsisAIService } from './medsynopsisAI.service';
import {
  MedSynopsisUserCaseDocument,
  MedSynopsisUserCaseEntity,
} from '../entity/medsynopsisUserCase.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserDocument } from 'src/user/entity/user.entity';
import { getPagination } from 'src/utilities/service/helpers.service';
import { Pagination } from 'src/quiz/types/quiz.types';

@Injectable()
export class MedSynopsisService {
  private readonly uid = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(MedSynopsisCategoryEntity.name)
    private readonly medCategoryModel: Model<MedSynopsisCategoryDocument>,
    @InjectModel(MedSynopsisCaseEntity.name)
    private readonly medSynopsisCaseModel: Model<MedSynopsisCaseDocument>,
    @InjectModel(MedSynopsisUserScoreEntity.name)
    private readonly medUserScoreModel: Model<MedSynopsisUserScoreDocument>,
    @InjectModel(MedSynopsisUserCaseEntity.name)
    private readonly medUserCaseModel: Model<MedSynopsisUserCaseDocument>,
    private readonly awsS3Service: AwsS3Service,
    private userService: UserService,
    @Inject(forwardRef(() => MedSynopsisAIService))
    private medsynopsisAIService: MedSynopsisAIService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  //Add Medsynopsis category
  async addMedSynopsisCategory(
    payload: MedCategoryInput,
    file: FileUpload,
  ): Promise<string> {
    try {
      let imageUrl: string;

      if (file) {
        // Save image to S3
        const { createReadStream } = await file;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          'medsynopsis-images',
          stream,
        );

        imageUrl = secure_url;
      }

      const createCategory = new this.medCategoryModel({
        ...payload,
        coverImage: imageUrl ? imageUrl : null,
      });

      return await createCategory
        .save()
        .then((res) => {
          return `You have successfully added ${payload.title} to the MedSynopsis category.`;
        })
        .catch((error) => {
          throw new BadRequestException(
            error?.message || 'An unexpected error occured!',
          );
        });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //Create category case
  async addMedSynopsisCase(payload: MedsynopsisCaseInput): Promise<string> {
    try {
      const { categoryUUID, caseTitle } = payload;
      const foundCategory = await this.getMedCategory(categoryUUID);
      const createCase = new this.medSynopsisCaseModel({
        ...payload,
      });

      return await createCase.save().then(async (res) => {
        await this.addCaseUUIDToCategory(categoryUUID, res?.caseUUID);

        return `You have successfully added ${caseTitle} to ${foundCategory?.title} category`;
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //Add case ID's to category
  async addCaseUUIDToCategory(
    categoryUUID: string,
    caseId: string,
  ): Promise<void> {
    try {
      await this.medCategoryModel.findOneAndUpdate(
        { categoryUUID },
        { $push: { contents: caseId } },
        { new: true },
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //Get All MedSynopsis Categories and content
  async getAllMedCategories(): Promise<MedSynopsisCategoryDocument[]> {
    try {
      const categories = await this.medCategoryModel
        .find()
        .select('categoryUUID title description coverImage createdAt updatedAt')
        .lean()
        .exec();

      return categories;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //Get Medsynopsis category by ID
  async getMedCategory(id: string): Promise<MedSynopsisCategoryDocument> {
    try {
      const foundCategory = await this.medCategoryModel.findOne({
        categoryUUID: id,
      });

      if (foundCategory) {
        return foundCategory;
      } else {
        throw new NotFoundException(`No category found!`);
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //Get All MedSynopsis Categories and content
  async getMedsynopsisCases(
    page?: number,
    limit?: number,
  ): Promise<GetMedSynopsisCaseRes> {
    try {
      const cases = await this.medSynopsisCaseModel
        .find()
        .sort({ _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.medSynopsisCaseModel,
        {},
        cases,
        limit,
        page,
      );

      return { cases, pagination };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //Generate question based on MedSynopsis category
  async getMedsynopsisCaseByCat(
    userUUID: string,
    categoryUUID: string,
  ): Promise<IMedRandomQuestionRes> {
    try {
      const foundCategory = await this.getMedCategory(categoryUUID);
      const { title } = foundCategory;
      let result: IMedRandomQuestionRes;

      if (foundCategory) {
        const foundUserScoresData = await this.medUserScoreModel.aggregate([
          { $match: { userUUID, 'userData.categoryName': title } },
          { $unwind: '$userData' },
          { $unwind: '$userData.content' },
          { $match: { 'userData.categoryName': title } },
          {
            $group: {
              _id: null,
              distinctCaseUUIDs: { $addToSet: '$userData.content.caseUUID' },
            },
          },
        ]); // Using index

        const answeredCaseUUIDs =
          foundUserScoresData.length > 0
            ? foundUserScoresData[0].distinctCaseUUIDs
            : [];

        // Find an unanswered case
        const [caseToAnswer] = await this.medSynopsisCaseModel.aggregate([
          {
            $match: {
              categoryUUID: categoryUUID,
              caseUUID: { $nin: answeredCaseUUIDs },
            },
          },
          { $sample: { size: 1 } }, // Randomly select one document
        ]); // Using index

        if (caseToAnswer) {
          result = {
            ...caseToAnswer,
            categoryUUID: categoryUUID,
            caseTitle: caseToAnswer.caseTitle,
            categoryTitle: foundCategory.title,
          };
        } else {
          // If no unanswered cases are found, return a random answered case
          const [randomAnsweredCase] =
            await this.medSynopsisCaseModel.aggregate([
              {
                $match: {
                  categoryUUID,
                  caseUUID: { $in: answeredCaseUUIDs },
                },
              },
              { $sample: { size: 1 } },
            ]); // Using index

          if (randomAnsweredCase) {
            result = {
              ...randomAnsweredCase,
              categoryUUID: categoryUUID,
              caseTitle: randomAnsweredCase.caseTitle,
              categoryTitle: foundCategory.title,
            };
          } else {
            throw new NotFoundException(`No cases available to answer`);
          }
        }
      } else {
        throw new NotFoundException(`Category not found`);
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Get MedSynopsis cases by Case UUID
  async getMedsynopsisCaseByUUID(
    caseUUID: string,
  ): Promise<MedSynopsisCaseDocument> {
    try {
      const foundCase = await this.medSynopsisCaseModel
        .findOne({ caseUUID })
        .exec();
      if (foundCase) {
        return foundCase;
      } else {
        throw new NotFoundException(
          `No case found with the provided case UUID`,
        );
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //GetUserScore
  async getUserAllMedSynopsisScores(
    userUUID: string,
  ): Promise<MedSynopsisUserScoreDocument | null> {
    try {
      const foundScore = await this.medUserScoreModel
        .findOne({ userUUID })
        .exec();
      if (foundScore) return foundScore;

      return null;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //GetUserScore
  async getUserMedSynopsisScore(
    userUUID: string,
    caseUUID: string,
  ): Promise<
    {
      score: number;
      caseUUID: string;
      gameType: string;
      totalUntimedScore: number;
      totalTimedScore: number;
    }[]
  > {
    try {
      const foundScore = await this.medUserScoreModel.aggregate([
        { $match: { userUUID, 'userData.content.caseUUID': caseUUID } },
        { $unwind: '$userData' },
        { $unwind: '$userData.content' },
        { $match: { 'userData.content.caseUUID': caseUUID } },
        {
          $project: {
            _id: 0,
            score: '$userData.content.score',
            caseUUID: '$userData.content.caseUUID',
            gameType: '$userData.content.gameType',
            totalTimedScore: '$userData.totalTimedScore',
            totalUntimedScore: '$userData.totalUntimedScore',
          },
        },
        { $sample: { size: 1 } },
      ]); // Using index

      if (foundScore.length > 0) {
        return foundScore;
      } else {
        return [];
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update MedSynopsis Category
  async updateMedSynopsisCategory(
    categoryUUID: string,
    payload: Partial<MedCategoryInput>,
    file?: FileUpload,
  ): Promise<string> {
    try {
      let imageUrl: string;

      if (file) {
        // Save image to S3
        const { createReadStream } = await file;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          'medsynopsis-images',
          stream,
        );

        imageUrl = secure_url;
      }

      const updateData = {
        ...payload,
        ...(imageUrl && { coverImage: imageUrl }),
      };

      const updatedCategory = await this.medCategoryModel.findOneAndUpdate(
        { categoryUUID },
        { $set: updateData },
        { new: true },
      );

      if (updatedCategory) {
        return `You have successfully updated the category with ID ${categoryUUID}.`;
      } else {
        throw new NotFoundException(
          `No category found with ID ${categoryUUID}`,
        );
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Delete MedSynopsis Category
  async deleteMedSynopsisCategory(categoryUUID: string): Promise<string> {
    try {
      const deletedCategory = await this.medCategoryModel.findOneAndDelete({
        categoryUUID,
      });

      if (deletedCategory) {
        return `You have successfully deleted the category with ID ${categoryUUID}.`;
      } else {
        throw new NotFoundException(
          `No category found with ID ${categoryUUID}`,
        );
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Update MedSynopsis Case
  async updateMedSynopsisCase(
    caseUUID: string,
    payload: Partial<MedsynopsisCaseInput>,
  ): Promise<string> {
    try {
      const updatedCase = await this.medSynopsisCaseModel.findOneAndUpdate(
        { caseUUID },
        { $set: payload },
        { new: true },
      );

      if (updatedCase) {
        return `You have successfully updated the case with ID ${caseUUID}.`;
      } else {
        throw new NotFoundException(`No case found with ID ${caseUUID}`);
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Delete MedSynopsis Case
  async deleteMedSynopsisCase(caseUUID: string): Promise<string> {
    try {
      const deletedCase = await this.medSynopsisCaseModel.findOneAndDelete({
        caseUUID,
      });

      if (deletedCase) {
        await this.medCategoryModel.updateMany(
          { categoryContent: caseUUID },
          { $pull: { categoryContent: caseUUID } },
        );

        return `You have successfully deleted the case with ID ${caseUUID}.`;
      } else {
        throw new NotFoundException(`No case found with ID ${caseUUID}`);
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  //Section for user Uploaded cases
  async addUserMedsynopsisCase(
    user: UserDocument,
    file: FileUpload,
    userPrompt?: string,
    threadId?: string,
  ): Promise<MedSynopsisUserCaseRes> {
    try {
      const payload = {
        userUUID: user.userUUID,
        userPrompt,
        threadId,
      };

      if (file) {
        const { createReadStream, filename } = await file;
        const fileExtension = path.extname(filename);
        if (
          !fileExtension?.includes('.pdf') &&
          !fileExtension?.includes('.doc') &&
          !fileExtension?.includes('.docx')
        ) {
          throw new BadRequestException(
            'File type must be of type pdf or word',
          );
        }
      }

      return await this.medsynopsisAIService.generateMedUserCaseSummary(
        payload,
        file,
        user,
      );
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async extractText(file: FileUpload, fileExtension: string): Promise<string> {
    try {
      const { createReadStream } = await file;
      const stream = createReadStream();
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      switch (fileExtension) {
        case '.pdf': {
          const { text } = await pdf(buffer);
          return text;
        }
        case '.docx': {
          const { value } = await mammoth.extractRawText({ buffer });
          return value;
        }
        default:
          throw new BadRequestException(
            'Invalid file type. Please upload a PDF or DOCX file.',
          );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Format the extracted text
  private formatText(text: string): string {
    // Basic text formatting
    text = text.replace(/\n{2,}/g, '\n\n'); // Preserve paragraphs
    text = text.replace(/(?:\r\n|\r|\n)/g, '<br>'); // Line breaks

    // Example formatting for bullet points and sections
    text = text
      .replace(/●/g, '<ul><li>')
      .replace(/\n/g, '</li><li>')
      .replace(/<\/li><li>$/, '</li></ul>');
    text = text.replace(/^(.*?):/gm, '<h4>$1</h4>'); // Convert headers

    // Basic text cleanup
    text = text.replace(/<br>\s*<br>/g, '<p></p>'); // Remove double line breaks

    return `<div>${text}</div>`;
  }

  //Get all user uploaded case
  async getAllUserUploadedMedCase(
    userUUID: string,
  ): Promise<MedSynopsisUserCaseDocument[]> {
    try {
      return this.medUserCaseModel.find({ userUUID }).exec(); // Using index
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Get User uploaded Medsysnopsis by case ID
  async getUserUploadedMedCaseByCaseId(
    userUUID: string,
    caseID: string,
  ): Promise<MedSynopsisUserCaseDocument | null> {
    try {
      const userCase = await this.medUserCaseModel
        .findOne(
          { userUUID },
          { userUUID: 1, userData: { $elemMatch: { caseID } } },
        )
        .exec();

      if (!userCase || userCase?.userData?.length === 0) {
        throw new NotFoundException('No case found!');
      }

      return userCase;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Get All uploaded users medsynopsis cases
  async getAllUploadUsersMedCases(): Promise<MedSynopsisUserCaseDocument[]> {
    try {
      const found = await this.medUserCaseModel.find();
      return found;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Update user uploaded case data
  async updateUserUploadedMedCaseById(
    user: UserDocument,
    caseID: string,
    updateData: Partial<UserCaseUploadInput>,
    file?: FileUpload,
  ): Promise<MedSynopsisUserCaseDocument> {
    try {
      const { createReadStream, filename } = await file;
      const fileExtension = path.extname(filename);

      if (
        !fileExtension?.includes('.pdf') &&
        !fileExtension?.includes('.doc') &&
        !fileExtension?.includes('.docx')
      ) {
        throw new BadRequestException('File type must be of type pdf or word');
      }
      updateData.userUUID = user.userUUID;
      return await this.medsynopsisAIService.updategenerateMedUserCaseSummary(
        updateData,
        file,
        caseID,
        user,
      );
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Delete User uploaded case
  async deleteUserUploadedMedCaseById(
    userUUID: string,
    caseID: string,
  ): Promise<string> {
    try {
      const userCase = await this.getUserUploadedMedCaseByCaseId(
        userUUID,
        caseID,
      );

      if (userCase) {
        return await this.medUserCaseModel
          .updateOne({ userUUID }, { $pull: { userData: { caseID } } })
          .exec()
          .then((res) => {
            return 'Successfully deleted this case!';
          })
          .catch((error) => {
            throw new BadRequestException(
              error?.message ||
                'Failed to delete the case. It might not exist.',
            );
          });
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Delete all user medsynopsysd case by user UUID
  async deleteAllMedsUserCase(userUUID: string) {
    try {
      const deleteCases = await this.medUserCaseModel.deleteMany({
        userUUID,
      });

      return { count: deleteCases.deletedCount };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Delete all user medsynopsysd score by user UUID
  async deleteAllMedsUserScore(userUUID: string) {
    try {
      const deleteScore = await this.medUserScoreModel.deleteMany({
        userUUID,
      });

      return { count: deleteScore.deletedCount };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
}
