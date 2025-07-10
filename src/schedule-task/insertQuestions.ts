import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  QuestionDocument,
  QuestionEntity,
} from 'src/quiz/entity/questions.entity';
import ShortUniqueId from 'short-unique-id';
import { QuizService } from 'src/quiz/service/quiz.service';
import { InsertQuestion } from 'src/utilities/interface/interface';
import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { CaseService } from 'src/quiz/service/case.service';

@Injectable()
export class InsertQuestionService {
  private readonly logger = new Logger(InsertQuestionService.name);
  private readonly uid = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionDocument>,
    private readonly quizService: QuizService,
    private readonly caseService: CaseService,
    private configService: ConfigService,
  ) {
    this.logger.log('InsertQuestionService instantiated');
  }

  // @Cron('0 12  * * *') // run the cron 2: 42 pm
  async insertQuestions() {
    this.logger.log('Cron job started');
    try {
      const subcategoriesMap = {}; // Map to track subcategories and IDs

      const quiz = await this.quizService.getQuiz('quizUUID'); // First create the quiz
      let category: string;

      const questions: InsertQuestion[] = [];

      // Remove duplicate questions
      const data = this.removeDuplicate(questions);

      const results = await Promise.all(
        data.map(async (item) => {
          category = item?.category;

          let subcatId: string;

          const question = await this.questionModel.findOne({
            'subcategory.subcat': item?.subcategory,
          });

          if (question) {
            subcatId = question?.subcategory?.id;
          } else {
            // Generate or retrieve subcategory ID
            subcatId = subcategoriesMap[item?.subcategory];

            if (!subcatId) {
              subcatId = this.uid.rnd(); // Generate unique ID for subcategory
              subcategoriesMap[item?.subcategory] = subcatId;
            }
          }

          // Construct options array with IDs
          const options = [
            { id: this.uid.rnd(), value: item.optionA },
            { id: this.uid.rnd(), value: item.optionB },
            { id: this.uid.rnd(), value: item.optionC },
            { id: this.uid.rnd(), value: item.optionD },
          ];

          // Find the correct answer among the options
          const answerId = options.find(
            (option) =>
              option.value.toLowerCase() === item.answer.toLowerCase(),
          )?.id;

          if (answerId) {
            // Construct answer object
            const answer = {
              id: answerId,
              answer: item.answer,
              reference: item?.reference || null,
              answer_details: item?.answer_details || null,
            };

            const subcategory = {
              id: subcatId,
              subcat: item?.subcategory,
            };

            // Construct the transformed question object
            const question = {
              quizUUID: quiz.quizUUID,
              userId: new ObjectId(
                this.configService.get<string>('MEDSCROLL_ID'),
              ), // NB: for diffrent environment
              question: item?.question,
              options,
              answer,
              subject: item?.subject || null,
              category,
              subcategory,
              topic: item?.topic || null,
              subtopic: item?.subtopic || null,
              keywords: item?.keywords || null,
            };

            return question;
          }
        }),
      );

      const documents = results.filter((item) => item !== undefined);

      await this.questionModel.insertMany(documents);

      const totalDuration = this.quizService.getTotalDuration(
        quiz.duration,
        documents.length,
        quiz?.totalDuration,
      );

      quiz.totalDuration = totalDuration;
      quiz.totalQuestion = quiz?.totalQuestion
        ? quiz?.totalQuestion + documents.length
        : documents.length;
      quiz.category = category;
      quiz.isMedscroll = true;
      await quiz.save();

      this.logger.log(`Inserted ${documents.length} questions`);
      this.logger.log('Cron job completed');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Remove duplicate questions
  removeDuplicate(questions: InsertQuestion[]): InsertQuestion[] {
    const questionMap = new Map();

    questions.forEach((questionObj) => {
      questionMap.set(questionObj.question, questionObj);
    });

    return [...questionMap.values()];
  }

  // @Cron('*/5 * * * *')// run the cron every 5 minutes
  async deleteDuplicateOpenEndedQuestion() {
    this.logger.log('Cron job started');
    try {
      // Aggregate to find duplicate questions
      const duplicateQuestionIds = await this.questionModel.aggregate([
        {
          $match: {
            userId: new ObjectId(
              this.configService.get<string>('MEDSCROLL_ID'),
            ),
            category: 'Open Ended',
          },
        },
        {
          $group: {
            _id: '$question', // Group by the question field
            ids: { $push: '$_id' }, // Collect ids of documents with same question
            count: { $sum: 1 }, // Count occurrences of each question
          },
        },
        {
          $match: {
            count: { $gt: 1 }, // Filter groups with more than one occurrence (i.e., duplicates)
          },
        },
      ]); // Using index

      // Remove duplicates
      await Promise.all(
        duplicateQuestionIds.map(async ({ ids }) => {
          const [, ...restIds] = ids; // Extract the first id and rest ids
          await this.questionModel.deleteMany({ _id: { $in: restIds } }); // Delete rest ids except the first one
        }),
      );

      this.logger.log('Duplicate open ended documents removed successfully');
      this.logger.log('Cron job completed');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // @Cron('*/5 * * * *')// run the cron every 5 minutes
  // async generateOpenEndedQuestion() {
  //   this.logger.log('Cron job started');
  //     await this.quizService.createOpenEndedAIAdminQuiz()
  //   this.logger.log('Open ended added successfully');
  //   this.logger.log('Cron job completed');
  // }

  // @Cron('51 20  * * *') // run the cron 2: 42 pm
  async deleteDuplicateQuestion() {
    this.logger.log('Cron job started');
    try {
      // Aggregate to find duplicate questions
      const duplicateQuestionIds = await this.questionModel.aggregate([
        {
          $match: {
            userId: new ObjectId(
              this.configService.get<string>('MEDSCROLL_ID'),
            ),
          },
        },
        {
          $group: {
            _id: '$question', // Group by the question field
            ids: { $push: '$_id' }, // Collect ids of documents with same question
            count: { $sum: 1 }, // Count occurrences of each question
          },
        },
        {
          $match: {
            count: { $gt: 1 }, // Filter groups with more than one occurrence (i.e., duplicates)
          },
        },
      ]); // Using index

      // Remove duplicates
      await Promise.all(
        duplicateQuestionIds.map(async ({ ids }) => {
          const [, ...restIds] = ids; // Extract the first id and rest ids
          await this.questionModel.deleteMany({ _id: { $in: restIds } }); // Delete rest ids except the first one
        }),
      );

      this.logger.log('Duplicate documents removed successfully');
      this.logger.log('Cron job completed');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // @Cron('5 * * * * *') // run the cron 5sec
  async deleteCaseQuestions() {
    await this.caseService.bulkWriteCase([
      {
        updateMany: {
          filter: { totalQuestion: { $gt: 0 } },
          update: { totalQuestion: 0 },
        },
      },
    ]);

    const quiz = await this.quizService.getQuiz(
      this.configService.get('CASE_QUIZ'),
    );

    // Update case category
    quiz.totalQuestion = 0;
    quiz.markModified('totalQuestion');
    await quiz.save();

    await this.questionModel.deleteMany({
      caseUUID: { $ne: null },
    });

    this.logger.log('Removed case questions and reset total question key');
  }
}
