import { BadRequestException, Injectable } from '@nestjs/common';
import { DriveDocument, DriveEntity } from '../entity/drive.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { DriveDataInput } from '../dto/drive.input';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import { getPagination } from 'src/utilities/service/helpers.service';
import { Pagination } from 'src/quiz/types/quiz.types';

@Injectable()
export class DriveService {
  constructor(
    @InjectModel(DriveEntity.name)
    private readonly driveModel: Model<DriveDocument>,
  ) {}

  // Create data in drive
  async addDriveData(
    userId: ObjectId,
    dateCreated: string,
    component: ComponentType,
    driveDataInput: DriveDataInput,
  ) {
    try {
      const { questions, fileUrl, ...rest } = driveDataInput;

      // Return if file is not uploaded and component is neither QUIZ_AI nor SLIDE_PRESENTATION
      if (
        !fileUrl &&
        component !== ComponentType.QUIZ_AI &&
        component !== ComponentType.SLIDE_PRESENTATION
      )
        return;

      const payload = {
        userId,
        dateCreated,
        component,
        content: { ...rest, fileUrl, questions: questions ? [questions] : [] },
      };

      if (fileUrl) {
        return await this.driveModel.create(payload);
      }

      const drive = await this.driveModel.findOne({
        dateCreated,
        userId,
        component,
        'content.threadId': driveDataInput?.threadId,
      });

      if (!drive) {
        return await this.driveModel.create(payload);
      }

      drive?.content?.questions.unshift(questions);
      drive.markModified('content'); // Mark data field as modified

      return await drive.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all drive content
  async getDriveByTitleCategory(
    userId: ObjectId,
    component?: string,
    dateCreated?: string,
    page?: number,
    limit?: number,
  ) {
    try {
      const query: any = { userId };

      // Filter by component
      if (component) {
        query.component = component;
      }

      // Filter by dateCreated
      if (dateCreated) {
        query.dateCreated = dateCreated;
      }

      const skip = (page - 1) * limit;

      const drive = await this.driveModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$dateCreated',
            data: { $push: '$$ROOT' },
          },
        },
        { $unwind: { path: '$data', preserveNullAndEmptyArrays: true } }, // Unwind the data array
        {
          $group: {
            _id: '$_id',
            data: { $push: '$data' },
          },
        },
        { $addFields: { data: { $slice: ['$data', 5] } } }, // Limit to 5 documents per dateCreated
        {
          $project: {
            _id: 0,
            title: '$_id', // Rename _id to title
            data: 1,
          },
        },
        { $sort: { title: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]); // Using index

      // Get the distinct dateCreated values to count total distinct dates
      const distinctDates = await this.driveModel.distinct(
        'dateCreated',
        query,
      );
      const totalRecords = distinctDates.length;
      const totalPages = Math.ceil(totalRecords / limit);

      const pagination = {
        totalRecords,
        totalPages,
        pageSize: limit,
        prevPage: page > 1 ? page - 1 : null,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
      };

      return { drive, pagination };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Get all drive content
  async getAllDrive(
    userId: ObjectId,
    component?: string,
    dateCreated?: string,
    page?: number,
    limit?: number,
  ) {
    try {
      const query: any = { userId }; // Define query

      // Filter by component
      if (component) {
        query.component = component;
      }

      // Filter by date created
      if (dateCreated) {
        query.dateCreated = dateCreated;
      }

      // Fetch drive content with pagination
      const drive = await this.driveModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(); // Using index

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.driveModel,
        query,
        drive,
        limit,
        page,
      );

      return { drive, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Search drive
  async searchDrive(
    userId: ObjectId,
    search?: string,
    page?: number,
    limit?: number,
  ) {
    try {
      const searchDrive = await this.driveModel.aggregate([
        {
          $search: {
            index: 'search_drive',
            compound: {
              must: [
                {
                  text: {
                    query: search,
                    path: [
                      'dateCreated',
                      'component',
                      'content.userPrompt',
                      'content.transcript',
                      'content.description',
                      'content.questions',
                    ],
                    fuzzy: {
                      maxEdits: 1,
                      maxExpansions: 10,
                    },
                  },
                },
              ],
              should: [
                {
                  phrase: {
                    query: search,
                    path: [
                      'dateCreated',
                      'component',
                      'content.userPrompt',
                      'content.transcript',
                      'content.description',
                      'content.questions',
                    ],
                    slop: 2,
                  },
                },
              ],
            },
            highlight: {
              path: [
                'dateCreated',
                'component',
                'content.userPrompt',
                'content.transcript',
                'content.description',
                'content.questions',
              ],
            },
            count: {
              type: 'total',
            },
          },
        },
        {
          $match: { userId },
        },
        {
          $project: {
            dateCreated: 1,
            component: 1,
            content: 1,
            driveUUID: 1,
          },
        },
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            documents: [
              {
                $skip: (page - 1) * limit,
              },
              {
                $limit: limit,
              },
            ],
          },
        },
      ]);

      const count = searchDrive[0]?.totalCount[0]?.count;

      const totalPages = Math.ceil(count / limit);

      const pagination = {
        totalRecords: count,
        totalPages,
        pageSize: searchDrive[0]?.documents?.length,
        prevPage: page > 1 ? page - 1 : null,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
      };

      return { drive: searchDrive[0]?.documents, pagination };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Delete all user drive
  async deleteAllUserDrive(userId: ObjectId) {
    try {
      const drive = await this.driveModel.deleteMany({ userId });

      return {
        count: drive.deletedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
