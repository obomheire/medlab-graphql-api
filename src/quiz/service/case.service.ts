import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { CaseDocument, CaseEntity } from '../entity/case.entity';
import { QuestionDocument, QuestionEntity } from '../entity/questions.entity';
import {
  CreateCaseInput,
  SubmitCaseResInput,
  UpdateCaseInput,
} from '../dto/case.input';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { FileUpload } from 'graphql-upload-ts';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import ShortUniqueId from 'short-unique-id';
import { InsertQuestion } from 'src/utilities/interface/interface';
import { Readable } from 'stream';
import { exclude, getPagination } from 'src/utilities/service/helpers.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  QUESTION_CASE_JOB,
  QUESTION_QUEUE,
} from 'src/utilities/constant/queue.constant';
import { UserService } from 'src/user/service/user.service';
import { ResponseInput } from '../dto/question.input';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENT_ENUMS } from 'src/utilities/constant/event.constant';
import { CaseStatusType, LeaderBoardEventsType } from '../enum/quiz.enum';
import { Pagination } from '../types/quiz.types';
import { UserDocument } from 'src/user/entity/user.entity';
import { CacheService } from 'src/cache/cache.service';
import { CACHE_KEY } from 'src/cache/constant/constant';

@Injectable()
export class CaseService {
  private readonly uid = new ShortUniqueId({ length: 6 });
  constructor(
    @InjectModel(CaseEntity.name)
    private readonly caseModel: Model<CaseDocument>,
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionDocument>,
    private readonly userService: UserService,
    private readonly awsS3Service: AwsS3Service,
    private configService: ConfigService,
    @InjectQueue(QUESTION_QUEUE) private questionQueue: Queue,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getCases(page?: number, limit?: number) {
    try {
      const cases = await this.caseModel
        .find()
        .sort('level')
        .skip((page - 1) * limit)
        .limit(limit);

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.caseModel,
        {},
        cases,
        limit,
        page,
      );

      return {
        cases,
        pagination,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getCaseById(id: string) {
    try {
      const value = await this.caseModel.findOne({ caseUUID: id });
      if (!value) throw new NotFoundException('No case found with this ID');
      return value;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async uploadCaseImages(files: FileUpload[]) {
    try {
      const streams = files.map((file) => {
        const { createReadStream } = file;
        const stream = createReadStream();
        return stream;
      });

      return await this.awsS3Service.uploadImages('case-images', streams);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async create(input: CreateCaseInput) {
    try {
      const payload = {
        ...input,
        caseId: this.uid.rnd(),
        userId: new ObjectId(this.configService.get<string>('MEDSCROLL_ID')),
      };

      return await this.caseModel.create(payload);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async update(caseUUID: string, payload: UpdateCaseInput) {
    try {
      await this.getCaseById(caseUUID);

      await this.caseModel.updateOne({ caseUUID }, payload);
      return await this.getCaseById(caseUUID);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async delete(caseUUID: string) {
    try {
      const caseValue = await this.getCaseById(caseUUID);
      // Delete case images
      if (caseValue.images?.length) {
        const imageUrls = caseValue.images.map((img) => img.url);
        await this.awsS3Service.deleteFiles(imageUrls);
      }
      // Delete Case Questions
      await this.questionModel.deleteMany({
        caseUUID,
      });

      // Delete Case
      await this.caseModel.deleteOne({ caseUUID });

      return { message: 'Case deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getCaseByLevel(level: number, user: UserDocument) {
    try {
      const { userUUID, isGuest } = user;

      if (isGuest && level > 1) {
        throw new BadRequestException(
          'Please sign up to unlock the next level!',
        );
      }

      let cases = await this.caseModel.find({
        $and: [
          { level },
          { totalQuestion: { $gt: 0 } },
          { presentedTo: { $ne: userUUID } }, // Using index
        ],
      }); // Using index

      if (!cases.length) {
        cases = await this.caseModel.find({
          $and: [{ level }, { totalQuestion: { $gt: 0 } }],
        }); // Using index
      }

      if (!cases.length)
        throw new NotFoundException('No case found in this level');

      const caseValue = cases.sort(() => Math.random() - 0.5)[0];
      await this.caseModel.updateOne(
        { caseUUID: caseValue.caseUUID },
        { $push: { presentedTo: userUUID } },
      );

      return caseValue;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async submitResponse(
    user: UserDocument,
    { responses, level, readingSpeed, component, region }: SubmitCaseResInput,
  ) {
    try {
      this.validateResponse(responses);

      let totalPoints = 0;
      let totalTimeTaken = 0;
      let totalCorrect = 0;
      let totalMissed = 0;
      let status = 'ONGOING';

      const CUT_OFF = 7;

      const caseScorePercentage = Math.ceil(
        (responses.filter((el) => el.isCorrect).length * 10) / responses.length,
      );

      responses.forEach(({ isCorrect, isMissed, timeTaken }) => {
        if (isCorrect && isMissed)
          throw new BadRequestException('A correct answer cannot be missed');

        if (isCorrect) {
          const speedBonus = timeTaken <= 8 ? 2 : 0;
          totalPoints += level + speedBonus;
          totalCorrect++;
        }

        if (isMissed) totalMissed++;

        totalTimeTaken += timeTaken || 0;
      });

      // Calculate the average speed
      user.caseResults.averageSpeed =
        (Number(user.caseResults.averageSpeed || 0) +
          totalTimeTaken / (responses.length || 1) +
          readingSpeed) /
        3;

      user.caseResults.levels.currentCount++;

      const currentCount = user.caseResults.levels.currentCount % 10 || 10;

      const is10thAndLessCutOff =
        user.caseResults.levels.currentCount === 10 &&
        user.caseResults.levels.currentPoints < CUT_OFF;

      const is10thAndAboutCutOff =
        user.caseResults.levels.currentCount === 10 &&
        user.caseResults.levels.currentPoints >= CUT_OFF;

      if (caseScorePercentage >= CUT_OFF) {
        user.caseResults.levels.currentPoints++;
      }

      if (is10thAndLessCutOff && user.caseResults.repeats === 1 && level > 1) {
        status = CaseStatusType.DEMOTED;
        user.caseResults.repeats = 2;
        user.caseResults.levels.current = user.caseResults.levels.current - 1;
        user.caseResults.levels.previous = level;

        user.caseResults.levels.currentCount = 0;
        user.caseResults.levels.currentPoints = 0;
      }

      if (is10thAndLessCutOff && user.caseResults.repeats > 1) {
        status = CaseStatusType.REPEAT_LEVEL;
        user.caseResults.repeats -= 1;
        user.caseResults.levels.currentCount = 0;
      }

      if (is10thAndLessCutOff && user.caseResults.repeats <= 1 && level === 1) {
        user.caseResults.repeats = 10000;
        user.caseResults.levels.currentCount = 0;
      }

      if (is10thAndAboutCutOff) {
        status = CaseStatusType.NEXT_LEVEL;

        user.caseResults.repeats = 2;
        user.caseResults.levels.previous = level;
        user.caseResults.levels.current = level + 1;
        user.caseResults.levels.lastTopLevel = level + 1;
        user.caseResults.levels.currentCount = 0;
        user.caseResults.levels.currentPoints = 0;
      }

      // Mark caseResult as modified
      user.markModified('caseResults');

      user.quizzer.totalPoints += totalPoints || 0;
      user.quizzer.totalQA += responses.length;

      await this.userService.updateUser(user, true); // Update daily & weekly streaks & save user

      // const { userRanking } = await this.userService.calculateRanking(userUUID); // Get user ranking

      this.eventEmitter.emit(LeaderBoardEventsType.ADD_SCORE, {
        user,
        region,
        component,
        points: totalPoints,
        timeTaken: totalTimeTaken,
      });

      await this.cacheService.clearCacheByPattern(`${CACHE_KEY.LEADERBOARD}:*`);

      return {
        totalPoints,
        totalCorrect,
        totalScore: user?.quizzer?.totalPoints,
        userRanking: null,
        readingSpeed,
        totalQuestion: 10, // responses.length
        status,
        caseResults: {
          ...user.caseResults,
          levels: { ...user.caseResults.levels, currentCount },
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Validate response (Check for duplicate question number/question UUID)
  validateResponse(responses: ResponseInput[]) {
    try {
      const questionUUIDs = new Set<string>();

      responses.forEach((response) => {
        if (questionUUIDs.has(response.questionUUID)) {
          throw new BadRequestException(
            'Duplicate question number/question UUID detected!',
          );
        }

        questionUUIDs.add(response.questionUUID);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Question Import methods
  async extractQuestionFromStream(input: FileUpload) {
    const { createReadStream } = input;

    // Function to read the stream and extract JSON content
    const streamToString = (stream: Readable): Promise<string> => {
      const chunks: any[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
    };

    // Read the stream and parse JSON content
    const jsonString = await streamToString(createReadStream());
    const jsonData = JSON.parse(jsonString);
    return jsonData;
  }

  async importQuestions(input: FileUpload) {
    try {
      const jsonData = (await this.extractQuestionFromStream(input)) || [];

      const questionLength = jsonData.length;
      const jobs = [],
        range = 200;
      const intervals = Math.floor(questionLength / range);

      if (!questionLength) return { message: 'Invalid import format' };

      for (let i = 0; i < intervals + 1; i++) {
        const jobData = jsonData.slice(i * range, (i + 1) * range - 1);
        const job = await this.questionQueue.add(QUESTION_CASE_JOB, jobData, {
          timeout: 6000,
          //   removeOnComplete: true,
        });

        jobs.push(job.id);
      }

      return {
        message: `${jobs.length} uploads batched. You will be notified after uploads are done.`,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async processQuestions(ques: InsertQuestion[]) {
    // const dedupedQuestions = this.removeDuplicate(ques); TODO: FIGURE OUT IF NEEDED

    let mappedQuestions = await Promise.all(
      ques.map(async (dt) => await this.mapQuestionToCase(dt)),
    );

    // try {
    //   // Write the mappedQuestions to a file named 'case' in the root directory
    //   await fs.writeFile('case', JSON.stringify(mappedQuestions, null, 2));
    //   return;
    // } catch (error) {
    //   console.error('Error writing to the case file:', error);
    // }

    mappedQuestions = mappedQuestions.filter((el) => el !== null);

    if (!mappedQuestions.length)
      throw new BadRequestException('No question added to records');

    const transformedData = await this.transformRawQuestions(mappedQuestions);

    await this.bulkWriteCaseQuestions(transformedData);
    await this.caseQuestionReports(transformedData);

    const quizUUID = this.configService.get('CASE_QUIZ');
    this.eventEmitter.emit(EVENT_ENUMS.QUIZ_UPDATE_QUESTION_NO, {
      quizUUID,
      total: transformedData.length,
    });

    return transformedData.length + 'added to question records';
  }

  async mapQuestionToCase(question: InsertQuestion) {
    if (!question?.case_id) return null;

    const caseValue = await this.caseModel.findOne({
      $or: [{ caseId: question.case_id }, { caseUUID: question.case_id }],
    });

    if (!caseValue) return null;

    const exists = await this.questionModel.exists({
      $and: [{ question: question.question }, { caseUUID: caseValue.caseUUID }],
    });

    if (exists) return null;

    const data = {
      ...exclude(question, ['case_id']),
      caseUUID: caseValue.caseUUID,
    } as Omit<InsertQuestion, 'case_id'> & { caseUUID: string };

    return data;
  }

  async transformRawQuestions(
    questions: Array<Omit<InsertQuestion, 'case_id'> & { caseUUID: string }>,
  ) {
    try {
      const subcategoriesMap = {}; // Map to track subcategories and IDs

      // const quiz = await this.quizService.getQuiz(
      //   'afc4182e-b626-414d-9e83-8130db0edb01',
      // ); // First create the quiz
      let category: string;

      const results = await Promise.all(
        questions.map(async (item) => {
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
              userId: new ObjectId(
                this.configService.get<string>('MEDSCROLL_ID'),
              ), // NB: for diffrent environment
              question: item?.question,
              options,
              answer,
              subject: item?.subject || null,
              category,
              topic: item?.topic || null,
              subtopic: item?.subtopic || null,
              keywords: item?.keywords || null,
              level: item.level,
              caseUUID: item.caseUUID,
              imageUrls: [],
            };

            return question;
          }
        }),
      );

      return results.filter((item) => item !== undefined);
    } catch (error) {
      throw new BadRequestException(error);
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

  async caseQuestionReports(questions: Record<string, any>[]) {
    try {
      const ids = questions.map((el) => el.caseUUID);

      const idSet = new Set(ids);
      const report = {} as Record<string, number>;

      ids.forEach((id) => {
        if (idSet.has(id) && report[id]) {
          report[id]++;
        }

        if (idSet.has(id) && !report[id]) {
          report[id] = 1;
        }
      });

      const queries = await Promise.all(
        Object.entries(report).map(async (entry) => {
          const [caseUUID, occurrences] = entry;

          const caseValue = await this.caseModel.findOne({ caseUUID });
          const totalQuestion =
            Number(caseValue.totalQuestion || 0) + occurrences;
          return {
            updateOne: {
              filter: { caseUUID },
              update: [
                {
                  $set: {
                    totalQuestion,
                  },
                },
              ],
            },
          };
        }),
      );

      if (queries.length) {
        await this.caseModel.bulkWrite(queries);
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async bulkWriteCaseQuestions<T>(questions: T) {
    try {
      return await this.questionModel.insertMany(questions);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async bulkWriteCase(caseQueries: any[]) {
    return await this.caseModel.bulkWrite(caseQueries);
  }
}
