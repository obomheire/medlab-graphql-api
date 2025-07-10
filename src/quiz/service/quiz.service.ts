/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import ShortUniqueId from 'short-unique-id';
import {
  AddOpenEndedQuestionInput,
  AddQuestionInput,
  CreateOpenEndedQuizAIInput,
  MedScrollOpenEndedQuizInput,
  UntimeQuizInput,
  UpdateOpenEndedQuestion,
  UpdateQuestion,
  UpdateQuestionInput,
  UpdateQuizInput,
} from '../dto/quiz.input';
import { QuizDocument, QuizEntity } from '../entity/quiz.entity';
import { QuestionDocument, QuestionEntity } from '../entity/questions.entity';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { MyQBType, NewQIdType, QuestionType } from '../enum/quiz.enum';
import { TransformedData } from '../types/quiz.types';
import { UserService } from 'src/user/service/user.service';
import { CustomCat } from 'src/user/entity/types.entity';
import { subcatImage } from 'src/utilities/constant/utils.costant';
import { CategoryData, CreateQuiz } from 'src/utilities/interface/interface';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_ENUMS } from 'src/utilities/constant/event.constant';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { QuestionService } from './question.service';
import { ConfigService } from '@nestjs/config';
import { QuizAIService } from 'src/llm-providers/openAI/service/ai.quiz.service';
import * as XLSX from 'xlsx';
import { CreateOpenEndedQuesInput } from '../dto/question.input';
import { conditions } from '../constant/openEnded.constants';
import { QuizQueueService } from 'src/utilities/service/queue/queue.service';
import { eventEmitterType } from 'src/utilities/enum/env.enum';
import { UserDocument } from 'src/user/entity/user.entity';

@Injectable()
export class QuizService {
  private readonly uid = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(QuizEntity.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionDocument>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => QuestionService))
    private readonly questionService: QuestionService,
    private readonly awsS3Service: AwsS3Service,
    private readonly quizAIService: QuizAIService,
    private configService: ConfigService,
    private readonly quizQueueService: QuizQueueService,
  ) {}

  // Get quiz category for home page
  async getCategory(userId: ObjectId): Promise<TransformedData> {
    try {
      const aggregatePipeline: any = [
        {
          $match: {
            $or: [{ isMedscroll: true }, { userId }],
            // category: { $nin: ['Open Ended Question'] },
          },
        },
        {
          $group: {
            _id: '$category',
            quizUUID: { $first: '$quizUUID' }, // Include the quizUUID field
            coverImage: { $first: '$coverImage' }, // Include the quizUUID field
            totalNumber: { $sum: '$totalQuestion' },
          },
        },
        {
          $sort: { _id: 1 }, // Sort categories by name in ascending order
        },
        {
          $project: {
            _id: 0,
            quizUUID: 1,
            coverImage: 1,
            category: '$_id',
            totalNumber: 1,
          },
        },
      ];

      const getCategories = await this.quizModel
        .aggregate(aggregatePipeline)
        .exec();

      // Add coverImage to the MyQBType.MYQB quiz if exists in categories
      let isQBexist = false;

      getCategories.forEach((item) => {
        if (item.category === MyQBType.MYQB) {
          item.coverImage = subcatImage.myQBImage;

          isQBexist = true;
        }
      });

      // If the object does not exist, add it with totalNumber: 0 and coverImage
      if (!isQBexist) {
        getCategories.push({
          category: MyQBType.MYQB,
          totalNumber: 0,
          coverImage: subcatImage.myQBImage,
        });
      }

      // Transform the categories to a map data structure
      const categories: { [key: string]: CategoryData } = getCategories.reduce(
        (acc, item) => {
          acc[item?.category] = {
            quizUUID: item?.quizUUID,
            coverImage: item?.coverImage,
            totalNumber: item?.totalNumber,
            category: item?.category,
          };
          return acc;
        },
        {},
      );

      return { categories };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Add custom quiz category
  async addQBQuizCategory(
    user: UserDocument,
    customCat: string,
  ): Promise<{ message: string }> {
    try {
      return await this.userService.addCustomCategory(user, customCat);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get QB quiz category by quizCategory that has at least one question in it
  async getQBQuizCategory(
    { customCategory }: UserDocument,
    query?: string,
  ): Promise<CustomCat[]> {
    try {
      if (query === 'hasQuestion') {
        // Collect array of ids for custom category
        const customCatIds = customCategory.map((cat) => cat.customCatId);

        // Find distinct customCatIds present in the question documents
        const questionCustomCatIds = await this.questionModel.distinct(
          'quizCategoryId',
          {
            quizCategoryId: { $in: customCatIds },
          },
        );

        // Filter custom categories to include only those that are present in question documents
        const catWithQuestions = customCategory.filter((cat) =>
          questionCustomCatIds.includes(cat.customCatId),
        );

        return catWithQuestions;
      }

      return customCategory;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Edit custom quiz category
  async editQBQuizCategory(
    customCatId: string,
    customCat: string,
  ): Promise<{ message: string }> {
    try {
      return await this.userService.updateCustomCategory(
        customCatId,
        customCat,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Ceate quiz
  async createQuiz(
    currentUser: UserDocument,
    createQuizInput: CreateQuiz,
    file?: FileUpload,
    foundUser?: UserDocument,
  ): Promise<QuizDocument> {
    try {
      const user: UserDocument = foundUser || currentUser;

      const userId = user._id;

      let imageUrl: string;

      const { quizCategory } = createQuizInput;
      const trimQuizCat = quizCategory?.trim(); // Remove white space

      if (file) {
        // Save image to S3
        const { createReadStream } = await file;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          'quiz-images',
          stream,
        );

        imageUrl = secure_url;
      }

      const customCatId = this.uid.rnd();

      const createdQuiz = new this.quizModel({
        ...createQuizInput,
        userId,
        coverImage: imageUrl ? imageUrl : null,
        quizCategory: { customCatId, customCat: trimQuizCat || null },
      });

      const saveQuiz = await createdQuiz.save();

      if (!user.customCategory.some((cat) => cat.customCat === trimQuizCat)) {
        user.customCategory.unshift({
          customCatId,
          customCat: trimQuizCat,
        });

        user.save();
      }

      return saveQuiz;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // upload bulk Open ended quiz
  async uploadBulkOpenEndedQuizByAdmin(
    user: UserDocument,
    medScrollOpenEndedQuizInput: MedScrollOpenEndedQuizInput,
    quizCoverImage?: FileUpload,
    questionFile?: FileUpload,
  ): Promise<string> {
    try {
      const foundQuiz = await this.quizModel.findOne({
        category: 'Open Ended Question',
      });

      const isMedScroll = true;
      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );

      const foundUser = !isMedScroll
        ? user
        : await this.userService.getUserByObjectId(medScrollId);

      const uploadedQuestions = await this.extractSpreadsheetContent(
        questionFile,
      );
      const firstIndex = uploadedQuestions[0];

      if (foundQuiz) {
        const newQuestionPayload = {
          quizUUID: foundQuiz?.quizUUID,
          questions: uploadedQuestions,
        };

        return await this.addOpenEndedQuestionToQuiz(
          foundUser,
          newQuestionPayload,
          foundUser,
          medScrollOpenEndedQuizInput.questionType,
        )
          .then((res) => 'Questions created successfully!')
          .catch(async (error) => {
            throw new BadRequestException(error?.message);
          });
      } else {
        const newQuizPayload = {
          ...medScrollOpenEndedQuizInput,
          description: firstIndex?.category,
          topic: firstIndex?.topic,
          duration: '01:00',
          point: 1,
          quizCategory: firstIndex?.category,
          category: 'Open Ended Question',
          isMedScroll,
        };

        return await this.createQuiz(
          foundUser,
          newQuizPayload,
          quizCoverImage,
          foundUser,
        )
          .then(async (res) => {
            if (res) {
              const { quizUUID } = res;
              const newQuestionPayload = {
                quizUUID,
                questions: uploadedQuestions,
              };

              return await this.addOpenEndedQuestionToQuiz(
                foundUser,
                newQuestionPayload,
                foundUser,
                medScrollOpenEndedQuizInput.questionType,
              )
                .then((res) => 'Quiz and Questions created successfully!')
                .catch(async (error) => {
                  // await this.quizModel.findOneAndDelete({ quizUUID });
                  throw new BadRequestException(error?.message);
                });
            }
          })
          .catch((error) => {
            throw new BadRequestException(error?.message);
          });
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //This is for redis queue to use
  async createOpenEndedAIAdminQuizAsync(
    payload: CreateOpenEndedQuesInput,
  ): Promise<string> {
    // Add job to the queue
    await this.quizQueueService.addDxQuestToQueue(payload);

    // Respond immediately without waiting for the process to finish
    return 'Dx Quest creation initiated. You will be notified once the process is complete.';
  }

  // Create Open ended quiz AI generated for Admin
  async generateOpenEndedAIAdminQuiz(
    payload: CreateOpenEndedQuesInput,
  ): Promise<string> {
    try {
      const { questionNo } = payload;
      const conditionsArea = [...conditions];
      let totalCount = 0;

      const questionPerCondition = Math.floor(
        questionNo / conditionsArea.length,
      );
      let extraQuestions = questionNo % conditionsArea.length; // Handle the remainder

      // Helper function to add delay
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      while (totalCount < questionNo && conditionsArea.length > 0) {
        const currentCondition = conditionsArea.pop(); // Get a condition
        payload.condition = currentCondition;

        // Calculate number of questions for this condition
        const questionsForThisCondition =
          questionPerCondition + (extraQuestions > 0 ? 1 : 0);
        if (extraQuestions > 0) extraQuestions--; // Distribute remainder equally

        let conditionCount = 0;
        while (conditionCount < questionsForThisCondition) {
          const numberOfQues = Math.min(
            questionsForThisCondition - conditionCount,
            15,
          ); // Max limit for fetching
          const newPayload = {
            ...payload,
            questionPerCondition: numberOfQues,
          };

          const saveData = await this.addQuestionToDb(
            newPayload,
            payload?.questionType,
          );
          const itemsFetched = saveData.totalQuestions;
          totalCount += itemsFetched;
          conditionCount += itemsFetched;

          // Check if we've fetched enough questions
          if (totalCount >= questionNo) {
            break;
          }

          // Wait for 2 minutes before the next batch
          await delay(120000);
        }
      }

      return `${totalCount} questions generated for the following specialty: ${payload?.specialty} and its subspecialty: ${payload?.subspecialty}`;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async addQuestionToDb(
    payload: any,
    questionType: string,
  ): Promise<{ totalQuestions: number; response: any }> {
    try {
      const foundQuiz = await this.quizModel.findOne({
        category: 'Open Ended Question',
      });
      const isMedScroll = true;
      // const questionType = 'Open ended short form';
      let totalQuestions = 0;
      let response;

      if (foundQuiz) {
        const generateQuestions =
          await this.quizAIService.generateOpenEndedQuesAdmin(payload);
        totalQuestions = generateQuestions?.questions?.length;

        if (generateQuestions?.questions) {
          const newQuestionPayload = {
            quizUUID: foundQuiz?.quizUUID,
            questions: generateQuestions?.questions,
          };

          response = await this.addOpenEndedQuestionToQuiz(
            generateQuestions?.user,
            newQuestionPayload,
            generateQuestions?.user,
            questionType,
          )
            .then((res) => 'Questions created successfully!')
            .catch(async (error) => {
              throw new BadRequestException(error?.message);
            });
        }
      } else {
        const generateQuestions =
          await this.quizAIService.generateOpenEndedQuesAdmin(payload);
        const firstIndex = generateQuestions?.questions[0];

        totalQuestions = generateQuestions?.questions?.length;

        if (generateQuestions?.questions) {
          const newQuizPayload = {
            description: firstIndex?.category,
            topic: firstIndex?.topic,
            duration: '01:00',
            point: 1,
            quizCategory: firstIndex?.category,
            category: 'Open Ended Question',
            isMedScroll,
            timer: 'all time',
            questionType,
          };

          response = await this.createQuiz(
            generateQuestions?.user,
            newQuizPayload,
            null,
            generateQuestions?.user,
          )
            .then(async (res) => {
              if (res) {
                const { quizUUID } = res;
                const newQuestionPayload = {
                  quizUUID,
                  questions: generateQuestions?.questions,
                };

                return await this.addOpenEndedQuestionToQuiz(
                  generateQuestions?.user,
                  newQuestionPayload,
                  generateQuestions?.user,
                  questionType,
                )
                  .then((res) => 'Quiz and Questions created successfully!')
                  .catch(async (error) => {
                    await this.quizModel.findOneAndDelete({ quizUUID });
                    throw new BadRequestException(error?.message);
                  });
              }
            })
            .catch((error) => {
              throw new BadRequestException(error?.message);
            });
        }
      }

      return {
        totalQuestions,
        response,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Ceate Open ended quiz with AI
  async createOpenEndedQuizAI(
    user: UserDocument,
    CreateOpenEndedQuizAIInput: CreateOpenEndedQuizAIInput,
    quizCoverImage?: FileUpload,
    file?: FileUpload,
  ): Promise<string> {
    try {
      const { aiAssist, quiz, isMedScroll } = CreateOpenEndedQuizAIInput;
      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );
      const foundUser = !isMedScroll
        ? user
        : await this.userService.getUserByObjectId(medScrollId);

      const payload = {
        ...aiAssist,
        questionType: quiz.questionType,
        topic: quiz.topic,
      };

      const generateQuestions = await this.quizAIService.generateDxAIquiz(
        payload,
        foundUser,
        file,
      );

      if (generateQuestions) {
        const createPayload = {
          questions: generateQuestions,
          quizUUID: '',
        };
        return await this.createQuiz(foundUser, quiz, quizCoverImage, foundUser)
          .then(async (res) => {
            if (res) {
              const { quizUUID } = res;
              createPayload.quizUUID = quizUUID;
              return await this.addOpenEndedQuestionToQuiz(
                foundUser,
                // createPayload,  //uncomment this later
                null, // remove this later
                foundUser,
                quiz.questionType,
              )
                .then((res) => 'Quiz and Questions created successfully!')
                .catch(async (error) => {
                  await this.quizModel.findOneAndDelete({ quizUUID });
                  throw new BadRequestException(error?.message);
                });
            }
          })
          .catch((error) => {
            throw new BadRequestException(error?.message);
          });
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Update quiz
  async updateQuiz(
    user: UserDocument,
    updateQuizInput: UpdateQuizInput,
    file?: FileUpload,
  ): Promise<QuizDocument> {
    try {
      let imageUrl: string;

      const { quizUUID, description, duration, point, topic, quizCategory } =
        updateQuizInput;

      // Get the quiz to update
      const quiz = await this.getQuiz(quizUUID);

      if (file) {
        // Delete cover image if exist
        if (quiz?.coverImage)
          await this.awsS3Service.deleteFiles([quiz.coverImage]);

        // Upload image to S3
        const { createReadStream } = await file;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          'quiz-images',
          stream,
        );

        imageUrl = secure_url;
      }

      // Trim the quiz category input
      const trimQuizCat = quizCategory?.trim();

      // Check if quizCategory already exists in user.customCategory
      let customCatId = user?.customCategory?.find(
        (cat) => cat?.customCat === trimQuizCat,
      )?.customCatId;

      // If quizCategory does not exist, create a new one
      if (!customCatId && trimQuizCat) {
        customCatId = this.uid.rnd();
        user.customCategory.unshift({ customCatId, customCat: trimQuizCat });
        await user.save();
      }

      // Update quiz
      Object.assign(quiz, {
        description: description || quiz.description,
        duration: duration || quiz.duration,
        point: point || quiz.point,
        coverImage: imageUrl || quiz.coverImage,
        topic: topic || quiz.topic,
        quizCategory: {
          customCatId: customCatId || quiz.quizCategory?.customCatId,
          customCat: trimQuizCat || quiz.quizCategory?.customCat,
        },
        totalDuration: duration
          ? this.getTotalDuration(duration, quiz?.totalQuestion) ||
            quiz.totalDuration
          : quiz.totalDuration,
      });

      await quiz.save();

      return quiz;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update questions added to quiz
  async updateQuestionInQuiz(
    user: UserDocument,
    { quizUUID, questions }: UpdateQuestionInput,
  ) {
    try {
      const newArrayId = NewQIdType.NEWQID;

      // Separate new questions from existing ones based on their UUID
      const { newQuestions, questionUpdate } = questions.reduce(
        (result, item) => {
          item.questionUUID === newArrayId
            ? result.newQuestions.push(item)
            : result.questionUpdate.push(item);

          return result;
        },
        { newQuestions: [], questionUpdate: [] },
      );

      // Update existing questions if there are any
      if (questionUpdate.length)
        await this.updateQuestion(user, quizUUID, questionUpdate);

      // Add new questions to the quiz if there are any
      if (newQuestions.length) {
        const questions = newQuestions?.map(
          ({ question, imageUrls, answer, options, topic, subtopic }) => ({
            question,
            imageUrls: imageUrls || [],
            options: options?.map(({ value }) => value),
            answer: answer?.answer,
            answer_details: answer?.answer_details || null,
            reference: answer?.reference || null,
            topic: topic || null,
            subtopic: subtopic || null,
          }),
        );

        // Add new questions to the quiz
        await this.addQuestionToQuiz(user, { questions, quizUUID });
      }

      return {
        message: 'Questions successfully updated',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Add questions to quiz
  async addQuestionToQuiz(
    user: UserDocument,
    { questions, quizUUID }: AddQuestionInput,
  ) {
    try {
      // Check for duplicate questions
      this.validateQuestion(questions, user?.subscription?.plan);

      // Check if any of the incoming questions already exist in the quiz
      const isQuestionExist = await this.questionModel.find({
        quizUUID,
        question: { $in: questions.map((item) => item.question) },
      }); // Using index

      if (isQuestionExist.length > 0) {
        const duplicateQuestions = isQuestionExist
          .map((question) => question.question)
          .join(': ');
        throw new BadRequestException(
          `One or more questions already exist in the quiz: ${duplicateQuestions}`,
        );
      }

      // Get quiz
      const quiz = await this.getQuiz(quizUUID);

      const documents = questions.map((item) => {
        const options = item.options.map((optionItem) => ({
          id: this.uid.rnd(),
          value: optionItem,
        }));

        // Find the correct answer among the options
        const answerId = options.find(
          (option) =>
            option?.value?.toLowerCase() === item?.answer?.toLowerCase(),
        )?.id;

        if (!answerId)
          throw new BadRequestException(
            'Cannot find answer in the options for one or more questions',
          );

        // Construct answer object
        const answer = {
          id: answerId,
          answer: item.answer,
          reference: item?.reference || null,
          answer_details: item?.answer_details || null,
        };

        // Construct the transformed question object
        const question: QuestionEntity = {
          quizUUID,
          userId: user._id,
          images: item?.imageUrls || [],
          question: item.question,
          options,
          answer: answer,
          category: MyQBType.MYQB,
          quizCategoryId: quiz?.quizCategory?.customCatId,
          topic: item?.topic,
          subtopic: item?.subtopic,
        };

        return question;
      });

      if (
        user.subscription.plan === SubPlanType.STARTER &&
        user.usedResources.questions + documents.length > 100
      )
        throw new BadRequestException(
          'Maximum number of questions exeeded, please upgrade your plan to add more questions.',
        );

      const insertedQuestions = await this.questionModel.insertMany(documents);

      const questionUUIDs = insertedQuestions.map((doc) => doc.questionUUID);

      const totalDuration = this.getTotalDuration(
        quiz.duration,
        questions.length,
        quiz?.totalDuration,
      );

      quiz.totalDuration = totalDuration;
      quiz.totalQuestion = quiz?.totalQuestion
        ? quiz?.totalQuestion + questions.length
        : questions.length;
      await quiz.save();

      user.usedResources.questions =
        user.usedResources.questions + documents.length;

      // Mark usedResources field as modified
      user.markModified('usedResources');
      await user.save();

      // Reset the presented to array in the quiz
      await this.questionModel.updateMany(
        { quizUUID },
        { $set: { presentedTo: [] } },
      );

      return {
        message: `Inserted ${documents.length} questions`,
        questionUUIDs,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async addOpenEndedQuestionToQuiz(
    currentUser: UserDocument,
    { questions, quizUUID }: AddOpenEndedQuestionInput,
    foundUser?: any,
    questionType?: string,
  ) {
    try {
      const user = foundUser || currentUser;

      // // Check for duplicate questions
      // this.validateQuestion(questions, user?.subscription?.plan);

      // Check if any of the incoming questions already exist in the quiz
      const existingQuestions = await this.questionModel.find({
        quizUUID,
        question: { $in: questions.map((item) => item.question) },
        category: questionType,
      }); // Using index

      // Remove the existing questions from the array
      const existingQuestionsText = existingQuestions.map(
        (question) => question.question,
      );
      const newQuestions = questions.filter(
        (item) => !existingQuestionsText.includes(item.question),
      );

      // If there are no new questions to add, return an appropriate message
      if (newQuestions.length === 0) {
        return { message: 'All provided questions already exist in the quiz' };
      }

      // Get quiz
      const quiz = await this.getQuiz(quizUUID);

      const documents = newQuestions.map((item) => {
        if (
          questionType?.toLowerCase()?.trimEnd().trimStart() !==
            QuestionType.BROAD_SCOPE_QUIZ.toLowerCase().trimEnd().trimStart() &&
          questionType?.toLowerCase()?.trimEnd().trimStart() !==
            QuestionType.MED_MATCH.toLowerCase().trimEnd().trimStart() &&
          questionType?.toLowerCase()?.trimEnd().trimStart() !==
            QuestionType.PROBLEM_LIST_EVALUATION.toLowerCase()
              .trimEnd()
              .trimStart() &&
          questionType?.toLowerCase()?.trimEnd().trimStart() !==
            QuestionType.DX_QUEST.toLowerCase().trimEnd().trimStart() &&
          !item?.options
        ) {
          throw new BadRequestException('Question options cannot be empty');
        }

        let options = [];
        if (item?.options?.length > 0) {
          options = item?.options?.map((optionItem) => ({
            id: this.uid.rnd(),
            value: optionItem,
          }));
        }

        // Find the correct answer among the options
        const answerId = options.find(
          (option) =>
            option?.value?.toLowerCase() === item?.answer?.toLowerCase(),
        )?.id;

        if (
          !answerId &&
          questionType?.toLowerCase()?.trimEnd()?.trimStart() !==
            QuestionType.BROAD_SCOPE_QUIZ.toLowerCase().trimEnd().trimStart() &&
          questionType?.toLowerCase()?.trimEnd()?.trimStart() !==
            QuestionType.MED_MATCH.toLowerCase().trimEnd().trimStart() &&
          questionType?.toLowerCase()?.trimEnd().trimStart() !==
            QuestionType.PROBLEM_LIST_EVALUATION.toLowerCase()
              .trimEnd()
              .trimStart() &&
          questionType?.toLowerCase()?.trimEnd()?.trimStart() !==
            QuestionType.DX_QUEST.toLowerCase().trimEnd().trimStart()
        ) {
          throw new BadRequestException(
            'Cannot find answer in the options for one or more questions',
          );
        }

        // Construct answer object
        const answer = {
          id: answerId || this.uid.rnd(),
          answer: item.answer,
          reference: item?.reference || null,
          answer_details: item?.answer_details || null,
        };

        const subcategory = {
          id: this.uid.rnd(),
          subcat: item?.subcategory,
        };

        // Construct the transformed question object
        const question: QuestionEntity = {
          ...item,
          quizUUID,
          userId: user._id,
          images: item?.imageUrls || [],
          question: item.question,
          options,
          hasOptions: false,
          answer: answer,
          category: questionType,
          subcategory: subcategory,
          quizCategoryId: quiz?.quizCategory?.customCatId,
          topic: item?.topic,
          subtopic: item?.subtopic,
          specialty: item.specialty,
          subspecialty: item.subspecialty,
          level:
            item?.level === 'beginner'
              ? 1
              : item?.level === 'intermediate'
              ? 2
              : item?.level === 'advance'
              ? 3
              : null,
          mode:
            questionType === QuestionType.DX_QUEST
              ? QuestionType.DX_QUEST
              : questionType === QuestionType.BROAD_SCOPE_QUIZ
              ? QuestionType.BROAD_SCOPE_QUIZ
              : questionType === QuestionType.MED_MATCH
              ? QuestionType.MED_MATCH
              : questionType === QuestionType.PROBLEM_LIST_EVALUATION
              ? QuestionType.PROBLEM_LIST_EVALUATION
              : questionType === QuestionType.USMLE_STEP1
              ? QuestionType.USMLE_STEP1
              : questionType === QuestionType.USMLE_STEP2
              ? QuestionType.USMLE_STEP2
              : questionType === QuestionType.MULTICHOICE
              ? QuestionType.MULTICHOICE
              : questionType === QuestionType.MEDSYNOPSIS
              ? QuestionType.MEDSYNOPSIS
              : null,
        };

        return question;
      });

      // Insert only the new questions
      await this.questionModel.insertMany(documents);

      const totalDuration = this.getTotalDuration(
        quiz.duration,
        newQuestions.length,
        quiz?.totalDuration,
      );

      quiz.totalDuration = totalDuration;
      quiz.totalQuestion = quiz?.totalQuestion
        ? quiz?.totalQuestion + newQuestions.length
        : newQuestions.length;
      await quiz.save();

      user.usedResources.questions =
        user.usedResources.questions + documents.length;

      // Mark usedResources field as modified
      user.markModified('usedResources');
      await user.save();

      // Reset the presented to array in the quiz
      await this.questionModel.updateMany(
        { quizUUID },
        { $set: { presentedTo: [] } },
      );

      return {
        message: `Inserted ${documents.length} new questions. ${existingQuestions.length} questions already existed and were skipped.`,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update questions added to quiz
  async updateQuestion(
    user: UserDocument,
    quizUUID: string,
    questions: UpdateQuestion[],
  ): Promise<void> {
    try {
      const {
        subscription: { plan },
      } = user;

      // Check for duplicate questions
      this.validateQuestion(questions, plan);

      // Check if all questionUUIDs exist
      const existingQuestions = await this.questionModel.find({
        quizUUID,
        questionUUID: { $in: questions.map((item) => item.questionUUID) },
      }); // Using index

      if (existingQuestions.length !== questions.length) {
        throw new NotFoundException('One or more questionUUIDs do not exist');
      }

      // Check for duplicates questions
      const isQuestionExist = await this.questionModel.find({
        quizUUID,
        questionUUID: { $nin: questions.map((item) => item.questionUUID) },
        question: { $in: questions.map((item) => item.question) },
      }); // Using index

      if (isQuestionExist.length > 0) {
        const duplicateQuestions = isQuestionExist
          .map((question) => question.question)
          .join(': ');
        throw new BadRequestException(
          `One or more questions already exist in the quiz: ${duplicateQuestions}`,
        );
      }

      const bulkUpdate = questions.map(
        ({
          questionUUID,
          question,
          imageUrls,
          answer,
          topic,
          subtopic,
          options,
        }) => ({
          updateOne: {
            filter: { questionUUID },
            update: {
              question,
              images: imageUrls || [],
              answer,
              topic: topic || null,
              subtopic: subtopic || null,
              options,
            },
          },
        }),
      );

      if (bulkUpdate.length > 0) {
        await this.questionModel.bulkWrite(bulkUpdate);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update questions added to quiz
  async updateOpenEndedQuestion(
    userUUID: string,
    quizUUID: string,
    questions: UpdateOpenEndedQuestion[],
  ): Promise<void> {
    try {
      const {
        subscription: { plan },
      } = await this.userService.getUserByUUID(userUUID);

      // Check for duplicate questions
      this.validateQuestion(questions, plan);

      // Check if all questionUUIDs exist
      const existingQuestions = await this.questionModel.find({
        quizUUID,
        questionUUID: { $in: questions.map((item) => item.questionUUID) },
      }); // Using index

      if (existingQuestions.length !== questions.length) {
        throw new NotFoundException('One or more questionUUIDs do not exist');
      }

      // Check for duplicates questions
      const isQuestionExist = await this.questionModel.find({
        quizUUID,
        questionUUID: { $nin: questions.map((item) => item.questionUUID) },
        question: { $in: questions.map((item) => item.question) },
      }); // Using index

      if (isQuestionExist.length > 0) {
        const duplicateQuestions = isQuestionExist
          .map((question) => question.question)
          .join(': ');
        throw new BadRequestException(
          `One or more questions already exist in the quiz: ${duplicateQuestions}`,
        );
      }

      const bulkUpdate = questions.map(
        ({
          questionUUID,
          question,
          imageUrls,
          answer,
          topic,
          subtopic,
          options,
        }) => ({
          updateOne: {
            filter: { questionUUID },
            update: {
              question,
              images: imageUrls || [],
              answer,
              topic: topic || null,
              subtopic: subtopic || null,
              options,
            },
          },
        }),
      );

      if (bulkUpdate.length > 0) {
        await this.questionModel.bulkWrite(bulkUpdate);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete quiz
  async deleteQuiz(
    quizUUID: string,
    userId: ObjectId,
  ): Promise<{ message: string }> {
    try {
      const quiz = await this.quizModel
        .findOne({
          quizUUID,
          userId,
        })
        .exec();

      if (!quiz) throw new NotFoundException('Quiz not found');

      // Delete cover image if exist
      if (quiz?.coverImage)
        await this.awsS3Service.deleteFiles([quiz.coverImage]);

      // Delete all questions in the quiz
      await this.questionModel.deleteMany({ quizUUID });

      // Delete quiz
      await quiz.deleteOne();

      return {
        message: 'Quiz deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  // Delete quizes
  async deleteQuizzes(userId: ObjectId) {
    try {
      const quizzes = await this.quizModel
        .find({ userId })
        .select('quizUUID coverImage')
        .exec(); // Using index

      // Collect cover images to delete
      const coverImages = quizzes
        .filter((quiz) => quiz.coverImage) // Only include quizzes that have a coverImage
        .map((quiz) => quiz.coverImage); // Extract the coverImage from each quiz

      if (coverImages?.length)
        await this.awsS3Service.deleteFiles(coverImages);

      // Collect quizUUIDs to delete questions
      const quizUUIDs = quizzes.map((quiz) => quiz.quizUUID);

      // Find all questions associated with the quizzes
      const questions = await this.questionModel
        .find({
          quizUUID: { $in: quizUUIDs },
        })
        .select('images')
        .exec(); // Using index

      // Collect all image URLs from the questions
      const questionImages = questions
        .filter((question) => question.images && question.images.length > 0)
        .flatMap((question) => question.images);

      if (questionImages.length) {
        // Delete all question images
        await this.awsS3Service.deleteFiles(questionImages);
      }

      // Delete all questions associated with the quizzes
      const deleteQuestions = await this.questionModel.deleteMany({
        quizUUID: { $in: quizUUIDs },
      });

      // Delete all quizzes
      const deleteQuizzes = await this.quizModel.deleteMany({ userId });

      return {
        questionCount: deleteQuestions.deletedCount,
        quizCount: deleteQuizzes.deletedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get quiz by user
  async getAllQuiz(userId: ObjectId): Promise<QuizDocument[]> {
    try {
      const quizs = await this.quizModel.find({ userId }).exec(); // Using index

      return quizs;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get quiz by id
  async getQuiz(quizUUID: string) {
    try {
      if (!quizUUID) throw new BadRequestException('quizUUID is required!');

      const quiz = await this.quizModel.findOne({ quizUUID }).exec();

      if (!quiz) throw new BadRequestException('Quiz not found!');

      return quiz;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  // Get quiz by categoryName
  async getQuizByCategoryName(categoryName: string) {
    try {
      if (!categoryName)
        throw new BadRequestException('category Name is required!');

      const quiz = await this.quizModel
        .findOne({ category: categoryName })
        .exec();

      if (!quiz) throw new BadRequestException('Quiz not found!');

      return quiz;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Play time quiz
  async playUntimeQuiz({ subcategory, totalQuestion }: UntimeQuizInput) {
    try {
      return await this.questionService.getQuestionIds(
        subcategory,
        totalQuestion,
        true,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Calculate total quiz duration from questions
  getTotalDuration(
    duration: string,
    numberOfQuestions: number,
    currentDuration?: string,
  ) {
    try {
      const [quizMinutes, quizSeconds] = duration.split(':').map(Number);
      const quizTotalSeconds = quizMinutes * 60 + quizSeconds;

      // Calculate total duration for all questions
      const totalDurationSeconds = quizTotalSeconds * numberOfQuestions;

      // Convert total duration back into hh:mm:ss format
      const totalDurationHours = Math.floor(totalDurationSeconds / 3600);
      const totalDurationMinutes = Math.floor(
        (totalDurationSeconds % 3600) / 60,
      );
      const totalDurationSecondsRemainder = totalDurationSeconds % 60;

      // Format the total duration
      const totalDuration = `${totalDurationHours
        .toString()
        .padStart(2, '0')}:${totalDurationMinutes
        .toString()
        .padStart(2, '0')}:${totalDurationSecondsRemainder
        .toString()
        .padStart(2, '0')}`;

      if (currentDuration) {
        const [newHours, newMinutes, newSeconds] = totalDuration
          .split(':')
          .map(Number);
        const [currentHours, currentMinutes, currentSeconds] = currentDuration
          .split(':')
          .map(Number);

        let totalSeconds = newSeconds + currentSeconds;
        let totalMinutes =
          newMinutes + currentMinutes + Math.floor(totalSeconds / 60);
        const totalHours =
          newHours + currentHours + Math.floor(totalMinutes / 60);

        totalSeconds %= 60;
        totalMinutes %= 60;

        return [
          totalHours.toString().padStart(2, '0'),
          totalMinutes.toString().padStart(2, '0'),
          totalSeconds.toString().padStart(2, '0'),
        ].join(':');
      }

      return totalDuration;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Validate question (Check for duplicate questions & word limit) // Generic
  validateQuestion<DataType>(questions: DataType[], plan: string) {
    const questionSet = new Set<string>();

    const wordLimits = {
      starter: 200,
      pro: 350,
    };

    const limit = wordLimits[plan];

    questions.forEach((item: any) => {
      if (questionSet.has(item.question))
        throw new BadRequestException(
          `Duplicate question found: ${item.question}`,
        );

      questionSet.add(item.question);

      const wordCount = item.question.split(' ').length;

      if (wordCount > limit)
        throw new BadRequestException(
          `Maximum words for one or more question exceeded (${limit} words), please reduce the words or upgrade your plan: ${item.question}`,
        );
    });
  }

  async extractSpreadsheetContent(file: FileUpload): Promise<any[]> {
    try {
      const { createReadStream } = file;
      const stream = createReadStream();

      const buffer = await this.streamToBuffer(stream);

      const workbook = XLSX.read(buffer, { type: 'buffer' });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new BadRequestException(
          'The spreadsheet must contain headers and at least one row of data.',
        );
      }

      // Extract headers
      const headers = jsonData[0] as string[];

      // Map the rows to objects using the headers
      const data = jsonData.slice(1).map((row) => {
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });
        return rowData;
      });

      return data;
    } catch (error) {
      throw new BadRequestException(
        `Failed to extract spreadsheet content: ${error.message}`,
      );
    }
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  @OnEvent(EVENT_ENUMS.QUIZ_UPDATE_QUESTION_NO, { async: true })
  async updateQuizQuestionsNo(data: { quizUUID: string; total: number }) {
    const quiz = await this.quizModel.findOne({ quizUUID: data.quizUUID });
    if (!quiz) throw new NotFoundException('Quiz with ID not found');

    quiz.totalQuestion = quiz.totalQuestion + data.total;
    quiz.markModified('totalQuestion');
    await quiz.save();
  }

  // Ceate medscroll quiz
  async createMedscrollQuiz(): Promise<{ message: string }> {
    try {
      const createdQuiz = new this.quizModel({
        userId: new ObjectId(this.configService.get<string>('MEDSCROLL_ID')),
        coverImage:
          'https://d1p9fc0i566fiv.cloudfront.net/logo-images/basic-sciences.png',
        quizName: 'Basic Sciences',
        topic: 'Basic Sciences',
        category: 'Basic Sciences',
        description: 'Basic Sciences',
        isMedscroll: true,
        timer: null,
        point: 1,
        duration: '00:30',
      });

      await createdQuiz.save();

      return { message: 'Mesdcroll quiz created successfully.' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
