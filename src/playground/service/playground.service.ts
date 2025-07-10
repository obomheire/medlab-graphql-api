import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AIInput,
  PlaygroundQuesToReviewInput,
  PlaygroundAddToDb,
  PlaygroundGeneralTriviaInput,
  PlaygroundOpenEndedInput,
  PlaygroundQuestInput,
  PlaygroundQuestionsUpdateInput,
  PlaygroundUpdateAndDeleteInput,
  PlaygroundMedsynopsisCaseInput,
  PlaygroundMedQuestionsUpdateInput,
  PlaygroundMedUpdateAndDeleteInput,
  PlaygroundConfigInput,
} from '../dto/playground.openEnded.dto';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import { ThreadMessageInput } from 'src/llm-providers/openAI/dto/assistant.input';
import { conditions } from 'src/quiz/constant/openEnded.constants';
import { InjectModel } from '@nestjs/mongoose';
import { QuizDocument, QuizEntity } from 'src/quiz/entity/quiz.entity';
import { Model } from 'mongoose';
import pdf from 'pdf-parse';
import TurndownService from 'turndown';
import {
  QuestionDocument,
  QuestionEntity,
} from 'src/quiz/entity/questions.entity';
import { QuizService } from 'src/quiz/service/quiz.service';
import { UserService } from 'src/user/service/user.service';
import { UserDocument } from 'src/user/entity/user.entity';
import { AddOpenEndedQuestionInput } from 'src/quiz/dto/quiz.input';
import { PlaygroundQuestType } from '../enum/playground.enum';
import { QuestionType } from 'src/quiz/enum/quiz.enum';
import ShortUniqueId from 'short-unique-id';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import {
  AMC1Prompt,
  basicSciencePrompt,
  clinicalSciencesPrompt,
  extractMasterOutline,
  generalTriviaPrompt,
  groupQuestionsPrompt,
  medicalTriviaPrompt,
  MedsynopsisPrompt,
  PLAB1Prompt,
  playGroundTemplateToMarkdown,
  pygrdBroadScopeQuizPrompt,
  pygrdDxQuestPrompt,
  pygrdDxQuestuserPrompt,
  pygrdMedMatchPrompt,
  pygrdPBLuserPrompt,
  RACPPrompt,
  USMLEPrompt,
  USMLEStep2CKPrompt,
} from '../constant/playground.constant';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import {
  PlaygroundConfigTopicRes,
  PlaygroundMedSynopsisReviewRes,
  PlaygroundReviewRes,
  UnReviewedMedQuestionRes,
  UnReviewedQuestionRes,
} from '../types/playground.types';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import {
  MedSynopsisCategoryDocument,
  MedSynopsisCategoryEntity,
} from 'src/medsynopsis/entity/medsynopsisCatergory.entity';
import {
  MedSynopsisCaseDocument,
  MedSynopsisCaseEntity,
} from 'src/medsynopsis/entity/medsynopsisCase.entity';
import {
  PlaygroundConfigDocument,
  PlaygroundConfigEntity,
} from '../entity/playgroundconfig.entity';
import mammoth from 'mammoth';
import { extname } from 'path';

@Injectable()
export class PlaygroundService {
  private readonly uid = new ShortUniqueId({ length: 16 });
  private turndownService: TurndownService;

  constructor(
    private asstThreadService: AsstThreadService,
    private configService: ConfigService,
    @InjectModel(QuizEntity.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionDocument>,
    private quizService: QuizService,
    private userService: UserService,
    private readonly awsS3Service: AwsS3Service,
    @InjectModel(MedSynopsisCategoryEntity.name)
    private readonly medCategoryModel: Model<MedSynopsisCategoryDocument>,
    @InjectModel(MedSynopsisCaseEntity.name)
    private readonly medSynopsisCaseModel: Model<MedSynopsisCaseDocument>,
    @InjectModel(PlaygroundConfigEntity.name)
    private readonly playgroundConfigModel: Model<PlaygroundConfigDocument>,
  ) {
    this.turndownService = new TurndownService();
  }

  async aiAssistant(
    payload: AIInput,
    outlineFile?: FileUpload,
  ): Promise<{ questions: any; threadId: string; user: UserDocument }> {
    try {
      const { threadId, prompt, component } = payload;
      const thread_id = threadId;

      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );

      const user = await this.userService.getUserByObjectId(medScrollId);

      const threadMessageInput: ThreadMessageInput = {
        threadId: thread_id,
        message: prompt,
      };

      const {
        message: content,
        threadId: chatThreadId,
        messageId,
      } = await this.asstThreadService.addMessage(
        user,
        threadMessageInput,
        component,
        null,
        outlineFile ? [outlineFile] : [],
        'playground-images',
      );

      const tempParse = JSON.parse(content);
      const generatedResponse = tempParse?.data;

      return {
        questions: generatedResponse,
        threadId: chatThreadId,
        user,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async generatePlaygroundOutline(
    file?: FileUpload,
    prompt?: string,
    threadId?: string,
  ): Promise<string> {
    try {
      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );
      const user = await this.userService.getUserByObjectId(medScrollId);
      const threadMessageInput: ThreadMessageInput = {
        threadId: threadId,
        message: prompt,
      };

      const {
        message: content,

        threadId: chatThreadId,
        messageId,
      } = await this.asstThreadService.addMessage(
        user,
        threadMessageInput,
        ComponentType.OUTLINE_TO_JSON,
        null,
        file ? [file] : [],
        'playground-images',
      );

      return content;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for creating a new playground config
  async createPlaygroundConfig(
    payload: PlaygroundConfigInput,
    masterOutline?: FileUpload,
    template?: FileUpload,
    sampleQuestion?: FileUpload,
  ): Promise<string> {
    try {
      const masterOutlineContent: any = {};
      const templateContent: any = {};
      const sampleQuestionContent: any = {};
      const matchQuery: any = {};
      const { subcategory, subject, specialty, subspecialty } = payload;

      if (masterOutline) {
        const fileExtension = extname(masterOutline?.filename)?.toLowerCase(); // Get file extension

        const data = await this.extractText(masterOutline, fileExtension);
        const result = await this.generatePlaygroundOutline(
          null,
          extractMasterOutline(data),
          null,
        );
        const markedDownResult = await this.convertDocxToMarkdown(
          masterOutline,
        );

        const formatResult = JSON.parse(result)?.data;
        masterOutlineContent.content = formatResult;
        masterOutlineContent.masterOutlineTemplate = markedDownResult;
        masterOutlineContent.fileName = masterOutline?.filename;
      }

      if (template) {
        const markedDownResult = await this.convertDocxToMarkdown(template);
        templateContent.content = markedDownResult;
        templateContent.fileName = template?.filename;
      }
      if (sampleQuestion) {
        const markedDownResult = await this.convertDocxToMarkdown(
          sampleQuestion,
        );
        sampleQuestionContent.content = markedDownResult;
        sampleQuestionContent.fileName = sampleQuestion?.filename;
      }

      if (subcategory) {
        matchQuery['subcategory'] = { $regex: subcategory, $options: 'i' };
      }
      if (subject) {
        matchQuery['subject'] = subject;
      }
      if (specialty) {
        matchQuery['specialty'] = specialty;
      }
      if (subspecialty) {
        matchQuery['subspecialty'] = subspecialty;
      }

      const foundConfig = await this.playgroundConfigModel
        .findOne(matchQuery)
        .exec();
      if (foundConfig) {
        if (Object.keys(masterOutlineContent).length > 0) {
          foundConfig.masterOutline = masterOutlineContent;
        }
        if (Object.keys(templateContent).length > 0) {
          foundConfig.template = templateContent;
        }
        if (Object.keys(sampleQuestionContent).length > 0) {
          foundConfig.sampleQuestion = sampleQuestionContent;
        }

        return await foundConfig.save().then(() => {
          return 'Playground config updated successfully';
        });
      } else {
        const config = new this.playgroundConfigModel({
          ...payload,
          masterOutline: masterOutlineContent,
          template: templateContent,
          sampleQuestion: sampleQuestionContent,
        });
        return await config.save().then((res) => {
          return 'Playground config created successfully';
        });
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for getting all playground configs
  async getPlaygroundConfigTopics(): Promise<PlaygroundConfigEntity[]> {
    try {
      return await this.playgroundConfigModel.find().exec();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for getting a playground config by id
  async getPlaygroundConfigBySubcategory(
    subcategory: string,
    subject?: string,
    specialty?: string,
    subspecialty?: string,
    category?: string,
  ): Promise<PlaygroundConfigEntity> {
    try {
      const matchQuery: any = {};
      if (subcategory) {
        matchQuery['subcategory'] = subcategory;
      }
      if (subject) {
        matchQuery['subject'] = subject;
      }
      if (specialty) {
        matchQuery['specialty'] = specialty;
      }
      if (subspecialty) {
        matchQuery['subspecialty'] = subspecialty;
      }
      matchQuery['category'] = category;
      const foundConfig = await this.playgroundConfigModel
        .findOne(matchQuery)
        .exec();
      if (!foundConfig) {
        return;
      }
      return foundConfig;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for getting topics and subtopics from master outline
  async getTopicsAndSubtopicsFromMasterOutline(
    category: string,
    subcategory?: string,
    subject?: string,
    specialty?: string,
    subspecialty?: string,
  ): Promise<PlaygroundConfigTopicRes> {
    try {
      const matchQuery: any = {};
      if (subcategory) {
        matchQuery['subcategory'] = subcategory;
      }
      if (subject) {
        matchQuery['subject'] = subject;
      }
      if (specialty) {
        matchQuery['specialty'] = specialty;
      }
      if (subspecialty) {
        matchQuery['subspecialty'] = subspecialty;
      }
      matchQuery['category'] = category;

      const foundTopics = await this.playgroundConfigModel
        .findOne(matchQuery)
        .exec();

      return {
        masterOutlineFileName: foundTopics?.masterOutline?.fileName,
        templateFileName: foundTopics?.template?.fileName,
        sampleQuestionFileName: foundTopics?.sampleQuestion?.fileName,
        data: foundTopics?.masterOutline?.content,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for updating and deleting questions

  async PlaygroundUpdateAndDeleteQues(
    payload: PlaygroundUpdateAndDeleteInput,
  ): Promise<string> {
    try {
      let discardedResult;
      if (payload.reviewed.length > 0) {
        await this.playgroundQuestionsUpdate(payload.reviewed);
      }
      if (payload.discarded.length > 0) {
        discardedResult = await this.playgroundDiscardQuestions(
          payload.discarded,
        );
      }

      return `Updated ${payload?.reviewed.length}, and discarded ${discardedResult?.deletedCount}`;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for updating and deleting questions
  async PlaygroundMedUpdateAndDeleteQues(
    payload: PlaygroundMedUpdateAndDeleteInput,
  ): Promise<string> {
    try {
      let discardedResult;
      if (payload.reviewed.length > 0) {
        await this.playgroundMedQuestionsUpdate(payload.reviewed);
      }
      if (payload.discarded.length > 0) {
        discardedResult = await this.playgroundMedDiscardQuestions(
          payload.discarded,
        );
      }

      return `Updated ${payload?.reviewed.length}, and discarded ${discardedResult?.deletedCount}`;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Update questions
  async playgroundQuestionsUpdate(
    updatedQuestions: PlaygroundQuestionsUpdateInput[],
  ): Promise<any> {
    try {
      // Step 1: Perform bulk update on questions
      const bulkOperations = updatedQuestions.map((question) => {
        return {
          updateOne: {
            filter: { questionUUID: question.questionUUID },
            update: {
              $set: question,
            },
            upsert: false,
          },
        };
      });

      const result = await this.questionModel.bulkWrite(bulkOperations);

      // Step 2: If the update is successful, update the quiz
      if (result.modifiedCount > 0) {
        const quiz = await this.quizModel
          .findOne({ category: updatedQuestions[0].category })
          .exec();

        if (quiz) {
          const totalDuration = this.quizService.getTotalDuration(
            quiz.duration,
            result.modifiedCount,
            quiz?.totalDuration,
          );

          quiz.totalDuration = totalDuration;
          quiz.totalQuestion = quiz?.totalQuestion
            ? quiz?.totalQuestion + result.modifiedCount
            : result.modifiedCount;

          await quiz.save();
        }
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Update medsynopsis questions
  async playgroundMedQuestionsUpdate(
    updatedQuestions: PlaygroundMedQuestionsUpdateInput[],
  ): Promise<any> {
    try {
      const bulkOperations = updatedQuestions.map((question) => {
        return {
          updateOne: {
            filter: { caseUUID: question.caseUUID },
            update: {
              $set: question,
            },
            upsert: false,
          },
        };
      });

      return await this.medSynopsisCaseModel.bulkWrite(bulkOperations);
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Update questions
  async playgroundDiscardQuestions(
    updatedQuestions: PlaygroundQuestionsUpdateInput[],
  ): Promise<any> {
    try {
      const bulkId = updatedQuestions.map((res) => res.questionUUID);

      const result = await this.questionModel.deleteMany({
        questionUUID: { $in: bulkId },
      });

      if (result?.deletedCount > 0) {
        const quiz = await this.quizModel
          .findOne({ category: updatedQuestions[0].category })
          .exec();

        if (quiz) {
          quiz.totalQuestion = Math.max(
            0,
            quiz.totalQuestion - result.deletedCount,
          );
          await quiz.save();
        }
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async playgroundMedDiscardQuestions(
    updatedQuestions: PlaygroundMedQuestionsUpdateInput[],
  ): Promise<any> {
    try {
      const bulkId = updatedQuestions.map((res) => res.caseUUID);

      const result = await this.medSynopsisCaseModel.deleteMany({
        caseUUID: { $in: bulkId },
      });

      return result;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async playgroundUnreviewedQuest(
    payload: PlaygroundQuesToReviewInput,
    reviewed: boolean,
  ): Promise<UnReviewedQuestionRes> {
    try {
      const {
        limit = 10,
        page = 1,
        category,
        questionType,
        subcategory,
        specialty,
        subject,
        subspecialty,
      } = payload;

      // Ensure valid limit and page numbers
      const pageSize = Math.max(limit, 1);
      const currentPage = Math.max(page, 1);

      const matchCriteria: any = {
        reviewed: reviewed,
        category: category,
      };

      // Add subcategory filter only if it is provided and not empty
      if (subcategory && subcategory.trim()) {
        matchCriteria.$expr = {
          $eq: [{ $toLower: '$subcategory.subcat' }, subcategory.toLowerCase()],
        };
      }
      if (questionType && questionType.trim()) {
        matchCriteria.mode = questionType.toUpperCase();
      }
      if (subspecialty && subspecialty.trim()) {
        matchCriteria.subspecialty = subspecialty;
      }
      if (specialty && specialty.trim()) {
        matchCriteria.specialty = specialty;
      }
      if (subject && subject.trim()) {
        matchCriteria.subject = subject;
      }

      const count = await this.questionModel.countDocuments(matchCriteria);
      const totalPages = Math.ceil(count / pageSize);

      const foundQuestions = await this.questionModel
        .aggregate([
          {
            $match: matchCriteria,
          },
          {
            $project: {
              question: 1,
              questionUUID: 1,
              quizUUID: 1,
              options: 1,
              answer: 1,
              questionNumber: 1,
              isGradeStrictly: 1,
              subspecialty: 1,
              subject: 1,
              category: 1,
              specialty: 1,
              reference: 1,
              topic: 1,
              subtopic: 1,
              reviewed: 1,
              level: 1,
              comments: 1,
            },
          },
        ])
        .sort({ _id: 1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .exec(); // Using index

      const pagination = {
        totalRecords: count,
        totalPages,
        pageSize: foundQuestions.length,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        currentPage,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
      };

      return { questions: foundQuestions, pagination };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async playgroundMedUnreviewedQuest(
    payload: PlaygroundQuesToReviewInput,
    reviewed: boolean,
  ): Promise<UnReviewedMedQuestionRes> {
    try {
      const {
        limit = 10,
        page = 1,
        category,
        subcategory, //note, this will be the categoryUUID
      } = payload;

      // Ensure valid limit and page numbers
      const pageSize = Math.max(limit, 1);
      const currentPage = Math.max(page, 1);

      const matchCriteria: any = {
        reviewed: reviewed,
      };

      // Add subcategory filter only if it is provided and not empty
      if (subcategory && subcategory.trim()) {
        matchCriteria.categoryUUID = subcategory;
      }

      const count = await this.medSynopsisCaseModel.countDocuments(
        matchCriteria,
      );
      const totalPages = Math.ceil(count / pageSize);

      const foundQuestions = await this.medSynopsisCaseModel
        .aggregate([
          {
            $match: matchCriteria,
          },
          {
            $project: {
              question: 1,
              caseUUID: 1,
              categoryUUID: 1,
              caseContent: 1,
              caseSummary: 1,
              caseTitle: 1,
              isGradeStrictly: 1,
              reviewed: 1,
            },
          },
        ])
        .sort({ _id: 1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .exec(); // Using index

      const pagination = {
        totalRecords: count,
        totalPages,
        pageSize: foundQuestions.length,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        currentPage,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
      };

      return { questions: foundQuestions, pagination };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async playgroundQuizAndQuestionsCreation(
    payload: PlaygroundQuestInput,
    file?: FileUpload,
    categoryUUID?: string,
    categoryImage?: FileUpload,
    subcategoryImage?: FileUpload,
  ): Promise<string> {
    try {
      const config = await this.getPlaygroundConfigBySubcategory(
        payload?.subcategory,
        payload?.subject,
        payload?.specialty,
        payload?.subspecialty,
        payload?.category,
      );

      const dxQuestPayload: any = {
        aiModel: payload?.aiModel,
        specialty: payload?.specialty,
        subspecialty: payload?.subspecialty,
        category: payload?.category,
        subcategory: payload?.subcategory,
        questionNo: payload?.questionNo,
        questionType: payload?.questionType,
        prompt: payload?.prompt,
        threadId: payload?.threadId,
        isGradeStrictly: payload?.isGradeStrictly,
        topics: payload?.topics,
        outline: config?.masterOutline?.masterOutlineTemplate,
        template: config?.template?.content,
        sampleQuestions: config?.sampleQuestion?.content,
      };
      const generalTrivialPayload: any = {
        specialty: payload?.specialty,
        subspecialty: payload?.subspecialty,
        aiModel: payload?.aiModel,
        subcategory: payload?.subcategory,
        category: payload?.category,
        questionNo: payload?.questionNo,
        questionType: payload?.questionType,
        subject: payload?.subject,
        section: payload?.section,
        prompt: payload?.prompt,
        threadId: payload?.threadId,
        topics: payload?.topics,
        outline: config?.masterOutline?.masterOutlineTemplate,
        template: config?.template?.content,
        sampleQuestions: config?.sampleQuestion?.content,
      };

      const cat = payload?.category?.toLowerCase();

      if (
        cat === 'basic sciences' &&
        (!payload.subcategory || !payload.subject || !payload.questionType)
      ) {
        throw new BadRequestException(
          'subcategory, questionType, and subject are required for basic sciences',
        );
      }
      if (
        cat === 'medical trivia' &&
        (!payload.subcategory || !payload.questionType)
      ) {
        throw new BadRequestException(
          'subcategory and questionType are required for medical trivia',
        );
      }
      if (
        cat === 'clinical sciences' &&
        !payload?.subspecialty &&
        !payload.specialty &&
        !payload.questionType
      )
        throw new BadRequestException(
          'specialty, subspecialty and questionType is needed for clinical sciences',
        );

      if (
        cat === 'medical exams' &&
        (!payload.subcategory || !payload.subject || !payload.questionType)
      ) {
        throw new BadRequestException(
          'subcategory, questionType and subject is needed for medical exams',
        );
      }
      if (payload?.category.toLowerCase() === 'open ended question') {
        return await this.createDxQuest(dxQuestPayload, file, subcategoryImage);
      } else if (payload?.category.toLowerCase() === 'medical exams') {
        return await this.createUSMLE(
          generalTrivialPayload,
          file,
          subcategoryImage,
        );
      } else if (payload?.category?.toLowerCase() === 'medsynopsis') {
        return await this.createMedsynopsis(
          generalTrivialPayload,
          categoryUUID,
          categoryImage,
          file,
        );
      } else {
        return await this.createGeneralTrivia(
          generalTrivialPayload,
          file,
          subcategoryImage,
        );
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async playgroundQuizAndQuestionsPreview(
    payload: PlaygroundQuestInput,
    file?: FileUpload,
  ): Promise<PlaygroundReviewRes> {
    try {
      const config = await this.getPlaygroundConfigBySubcategory(
        payload?.subcategory,
        payload?.subject,
        payload?.specialty,
        payload?.subspecialty,
        payload?.category,
      );

      // console.log('config', config);
      const dxQuestPayload = {
        aiModel: payload?.aiModel,
        specialty: payload?.specialty,
        subspecialty: payload?.subspecialty,
        subcategory: payload?.subcategory,
        category: payload?.category,
        questionNo: payload?.questionNo,
        questionType: payload?.questionType,
        prompt: payload?.prompt,
        threadId: payload?.threadId,
        isGradeStrictly: payload?.isGradeStrictly,
        topics: payload?.topics,
        outline: config?.masterOutline?.masterOutlineTemplate,
        template: config?.template?.content,
        sampleQuestions: config?.sampleQuestion?.content,
      };
      const generalTrivialPayload = {
        aiModel: payload?.aiModel,
        subcategory: payload?.subcategory,
        category: payload?.category,
        questionNo: payload?.questionNo,
        questionType: payload?.questionType,
        subject: payload?.subject,
        prompt: payload?.prompt,
        topics: payload?.topics,
        outline: config?.masterOutline?.masterOutlineTemplate,
        template: config?.template?.content,
        sampleQuestions: config?.sampleQuestion?.content,
        threadId: payload?.threadId,
        specialty: payload?.specialty,
        subspecialty: payload?.subspecialty,
        section: payload?.section,
      };

      const cat = payload?.category?.toLowerCase();

      if (
        cat === 'basic sciences' &&
        !payload?.subcategory &&
        !payload.subject &&
        !payload.questionType
      )
        throw new BadRequestException(
          'subcategory, questionType and subject is needed for basic sciences',
        );
      if (
        cat === 'medical trivia' &&
        !payload?.subcategory &&
        !payload.questionType
      )
        throw new BadRequestException(
          'subcategory and questionType are needed for medical trivia',
        );

      if (
        cat === 'clinical sciences' &&
        !payload?.subspecialty &&
        !payload.specialty &&
        !payload.questionType
      )
        throw new BadRequestException(
          'specialty, subspecialty and questionType is needed for clinical sciences',
        );
      if (cat === 'medical exams' && !payload?.subcategory && !payload.subject)
        throw new BadRequestException(
          'subcategory and subject is needed for medical exams',
        );

      if (payload?.category.toLowerCase() === 'open ended question') {
        return await this.dxQuestPreview(dxQuestPayload, file);
      } else if (payload?.category.toLowerCase() === 'medical exams') {
        return await this.USMLEPreview(generalTrivialPayload);
      } else {
        return await this.generalTriviaPreview(generalTrivialPayload, file);
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async playgroundMedsynopsisQuestionsPreview(
    payload: PlaygroundQuestInput,
    file: FileUpload,
  ): Promise<PlaygroundMedSynopsisReviewRes> {
    try {
      const generalTrivialPayload: PlaygroundGeneralTriviaInput = {
        aiModel: payload?.aiModel,
        subcategory: payload?.subcategory,
        category: payload?.category,
        questionNo: payload?.questionNo,
        questionType: payload?.questionType,
        subject: payload?.subject,
        prompt: payload?.prompt,
        threadId: payload?.threadId,
        specialty: payload?.specialty,
        subspecialty: payload?.subspecialty,
      };
      return await this.createMedsynopsisPreview(
        generalTrivialPayload,
        file,
        generalTrivialPayload.subcategory,
      );
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Section for creating Open ended questions
  async createDxQuest(
    payload: PlaygroundOpenEndedInput,
    outlineFile?: FileUpload,
    coverImage?: FileUpload,
  ): Promise<any> {
    const { questionNo, questionType, subcategory, category } = payload;

    const conditionsArea = [...conditions];
    let totalCount = 0;
    let threadId = payload.threadId;

    const questionPerCondition = Math.floor(questionNo / conditionsArea.length);
    let extraQuestions = questionNo % conditionsArea.length; // Handle the remainder

    // Helper function to add delay
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const promptPayload = {
      condition: '',
      specialty: payload.specialty,
      subspecialty: payload.subspecialty,
      questionPerCondition: 0,
      prompt: payload.prompt,
      category,
    };

    while (totalCount < questionNo && conditionsArea.length > 0) {
      const currentCondition = conditionsArea.pop(); // Get a condition

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
        const quesType = subcategory.trim().toLowerCase();
        const newPayload: PlaygroundAddToDb = {
          ...payload,
          quizCategory: category,
          questCategory: category,
          questionType: subcategory,
          aIPayload: null,
          threadId,
        };

        promptPayload.condition = currentCondition;
        promptPayload.questionPerCondition = numberOfQues;

        const promptType =
          quesType === 'problem list evaluation'
            ? pygrdPBLuserPrompt(promptPayload)
            : quesType === 'med match'
            ? pygrdMedMatchPrompt(promptPayload)
            : quesType === 'broad scope quiz'
            ? pygrdBroadScopeQuizPrompt(promptPayload)
            : pygrdDxQuestPrompt(promptPayload);
        const noPromptType =
          quesType === 'problem list evaluation'
            ? pygrdPBLuserPrompt(promptPayload)
            : quesType === 'med match'
            ? pygrdMedMatchPrompt(promptPayload)
            : quesType === 'broad scope quiz'
            ? pygrdBroadScopeQuizPrompt(promptPayload)
            : pygrdDxQuestuserPrompt(promptPayload);

        const aIPayload = {
          threadId: threadId,
          prompt: payload.prompt ? promptType : noPromptType,
          component:
            quesType === ComponentType.DX_QUEST.trim().toLowerCase()
              ? ComponentType.DX_QUEST
              : quesType === ComponentType.BROAD_SCOPE_QUIZ.trim().toLowerCase()
              ? ComponentType.BROAD_SCOPE_QUIZ
              : quesType === ComponentType.MED_MATCH.trim().toLowerCase()
              ? ComponentType.MED_MATCH
              : quesType ===
                ComponentType.PROBLEM_LIST_EVALUATION.trim().toLowerCase()
              ? ComponentType.PROBLEM_LIST_EVALUATION
              : null,
        };

        newPayload.aIPayload = aIPayload;

        const saveData = await this.addQuestionToDb(
          newPayload,
          outlineFile,
          coverImage,
        );
        const itemsFetched = saveData.totalQuestions;
        totalCount += itemsFetched;
        conditionCount += itemsFetched;
        if (!threadId && saveData?.threadId) {
          threadId = saveData.threadId;
        }

        // Check if we've fetched enough questions
        if (totalCount >= questionNo) {
          break;
        }

        // Wait for 2 minutes before the next batch
        await delay(120000);
      }
    }

    return `${totalCount} questions generated`;
  }

  async dxQuestPreview(
    payload: PlaygroundOpenEndedInput,
    outlineFile?: FileUpload,
  ): Promise<PlaygroundReviewRes> {
    const { questionType, category, subcategory } = payload;
    const numberOfQuestions = 10;
    const response = [];

    let threadId = payload.threadId;

    const conditionsArea = [...conditions];
    let totalCount = 0;

    const questionPerCondition = Math.floor(
      numberOfQuestions / conditionsArea.length,
    );
    let extraQuestions = numberOfQuestions % conditionsArea.length; // Handle the remainder

    while (totalCount < numberOfQuestions && conditionsArea.length > 0) {
      const currentCondition = conditionsArea.pop(); // Get a condition

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

        const quesType = subcategory.trim().toLowerCase();
        const promptPayload = {
          condtion: currentCondition,
          specialty: payload.specialty,
          subspecialty: payload.subspecialty,
          questionPerCondition: numberOfQues,
          prompt: payload.prompt,
          category,
        };

        const aIPayload = {
          threadId,
          prompt: payload.prompt
            ? pygrdDxQuestuserPrompt(promptPayload)
            : pygrdDxQuestPrompt(promptPayload),
          component:
            quesType === ComponentType.DX_QUEST.trim().toLowerCase()
              ? ComponentType.DX_QUEST
              : quesType === ComponentType.BROAD_SCOPE_QUIZ.trim().toLowerCase()
              ? ComponentType.BROAD_SCOPE_QUIZ
              : quesType === ComponentType.MED_MATCH.trim().toLowerCase()
              ? ComponentType.MED_MATCH
              : quesType ===
                ComponentType.PROBLEM_LIST_EVALUATION.trim().toLowerCase()
              ? ComponentType.PROBLEM_LIST_EVALUATION
              : null,
        };

        const generateQuestions = await this.aiAssistant(
          aIPayload,
          outlineFile,
        );

        if (!threadId && generateQuestions?.threadId) {
          threadId = generateQuestions.threadId;
        }

        const itemsFetched = generateQuestions?.questions?.length;
        totalCount += itemsFetched;
        conditionCount += itemsFetched;
        response.push(...generateQuestions?.questions);

        // Check if we've fetched enough questions
        if (totalCount >= numberOfQuestions) {
          break;
        }
      }
    }

    return {
      questions: response,
      threadId,
    };
  }

  /** Section for Medical Trivia, Basic science etc. */
  async createGeneralTrivia(
    payload: PlaygroundGeneralTriviaInput,
    file?: FileUpload,
    coverImage?: FileUpload,
  ): Promise<any> {
    try {
      const {
        questionNo,
        category,
        specialty,
        subspecialty,
        subcategory,
        questionType,
        prompt,
        section,
        topics,
        outline,
        template,
        sampleQuestions,
      } = payload;
      const noOfOptions = Math.min(4);
      const lowerCaseCategory = category?.trim().toLowerCase();
      const isBasicSciences =
        lowerCaseCategory === 'basic sciences' ? true : false;
      const isMedicalTrivial =
        lowerCaseCategory === 'medical trivia' ? true : false;
      const isClinicalSciences =
        lowerCaseCategory === 'clinical sciences' ? true : false;

      let totalCount = 0;
      let threadId = payload.threadId;
      const remainingQuestions = questionNo - totalCount;

      const aiPromptPayload: any = {
        prompt,
        noOfOptions,
        category,
        subcategory,
        topics,
        outline,
        template,
        sampleQuestions,
        noOfQuestion: Math.min(remainingQuestions, 20),
      };

      if (isBasicSciences || isMedicalTrivial) {
        aiPromptPayload.subject = payload?.subject;
      }
      if (isClinicalSciences) {
        aiPromptPayload.specialty = specialty;
        aiPromptPayload.subspecialty = subspecialty;
      }

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const aIPayload = {
        threadId: threadId,
        prompt: isBasicSciences
          ? basicSciencePrompt(aiPromptPayload)
          : isClinicalSciences
          ? clinicalSciencesPrompt(aiPromptPayload)
          : isMedicalTrivial
          ? medicalTriviaPrompt(aiPromptPayload)
          : generalTriviaPrompt(aiPromptPayload),
        component:
          lowerCaseCategory === ComponentType.BASIC_SCIENCE.toLowerCase()
            ? ComponentType.BASIC_SCIENCE
            : lowerCaseCategory === ComponentType.MEDICAL_TRIVIA.toLowerCase()
            ? ComponentType.MEDICAL_TRIVIA
            : lowerCaseCategory === ComponentType.GENERAL_TRIVIA.toLowerCase()
            ? ComponentType.GENERAL_TRIVIA
            : lowerCaseCategory === ComponentType.CLINICAL_SCIENCE.toLowerCase()
            ? ComponentType.CLINICAL_SCIENCE
            : null,
      };

      const newPayload: any = {
        ...payload,
        quizCategory: category,
        questCategory: category,
        subcategory: subcategory || specialty,
        questionType,
        threadId,
        aIPayload,
        isGradeStrictly: false,
      };

      while (totalCount < questionNo) {
        const saveData = await this.addQuestionToDb(
          newPayload,
          file,
          coverImage,
        );
        const itemsFetched = saveData.totalQuestions;
        totalCount += itemsFetched;
        if (!threadId && saveData?.threadId) {
          threadId = saveData.threadId;
        }

        // Check if we've fetched enough questions
        if (totalCount >= questionNo) {
          break;
        }

        // Wait for 2 minutes before the next batch
        await delay(120000);
      }

      return `${totalCount} questions generated`;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async generalTriviaPreview(
    payload: PlaygroundGeneralTriviaInput,
    file?: FileUpload,
  ): Promise<PlaygroundReviewRes> {
    try {
      const {
        category,
        subcategory,
        prompt,
        specialty,
        subspecialty,
        topics,
        outline,
        template,
        sampleQuestions,
      } = payload;
      const noOfOptions = Math.min(4);
      const lowerCaseCategory = category?.trim().toLowerCase();
      const isBasicSciences =
        lowerCaseCategory === 'basic sciences' ? true : false;
      const isClinicalSciences =
        lowerCaseCategory === 'clinical sciences' ? true : false;
      const isMedicalTrivia =
        lowerCaseCategory === 'medical trivia' ? true : false;

      const response = [];

      let totalCount = 0;
      let threadId = payload.threadId;

      const aiPromptPayload: any = {
        prompt,
        noOfOptions,
        category,
        subcategory,
        topics,
        outline,
        template,
        sampleQuestions,
        noOfQuestion: 10,
      };

      if (isBasicSciences || isMedicalTrivia) {
        aiPromptPayload.subject = payload?.subject;
      }
      if (isClinicalSciences) {
        aiPromptPayload.specialty = specialty;
        aiPromptPayload.subspecialty = subspecialty;
      }

      const aIPayload = {
        threadId: threadId,
        prompt: isBasicSciences
          ? basicSciencePrompt(aiPromptPayload)
          : isClinicalSciences
          ? clinicalSciencesPrompt(aiPromptPayload)
          : isMedicalTrivia
          ? medicalTriviaPrompt(aiPromptPayload)
          : generalTriviaPrompt(aiPromptPayload),
        component:
          lowerCaseCategory === ComponentType.BASIC_SCIENCE.toLowerCase()
            ? ComponentType.BASIC_SCIENCE
            : lowerCaseCategory === ComponentType.MEDICAL_TRIVIA.toLowerCase()
            ? ComponentType.MEDICAL_TRIVIA
            : lowerCaseCategory === ComponentType.GENERAL_TRIVIA.toLowerCase()
            ? ComponentType.GENERAL_TRIVIA
            : lowerCaseCategory === ComponentType.CLINICAL_SCIENCE.toLowerCase()
            ? ComponentType.CLINICAL_SCIENCE
            : null,
      };

      const generateQuestions = await this.aiAssistant(aIPayload, file);

      if (!threadId && generateQuestions?.threadId) {
        threadId = generateQuestions.threadId;
      }

      const itemsFetched = generateQuestions?.questions?.length;
      totalCount += itemsFetched;
      response.push(...generateQuestions?.questions);

      return {
        questions: response,
        threadId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createUSMLE(
    payload: PlaygroundGeneralTriviaInput,
    file?: FileUpload,
    coverImage?: FileUpload,
  ): Promise<any> {
    try {
      const {
        questionNo,
        category,
        subcategory,
        subject,
        prompt,
        section,
        topics,
        outline,
        template,
        sampleQuestions,
      } = payload;
      const noOfOptions = Math.min(4); // Assuming this value is fixed at 4

      let totalCount = 0;
      let threadId = payload.threadId;
      const remainingQuestions = questionNo - totalCount;

      const aiPromptPayload = {
        prompt,
        noOfOptions,
        category,
        subcategory,
        subject,
        section,
        topics,
        outline,
        template,
        sampleQuestions,
        noOfQuestion: Math.min(remainingQuestions, 20),
      };

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const lowerCaseSubCategory = subcategory?.toLowerCase().trim();
      let finalPrompt: string;
      let selectedComponent: ComponentType;

      if (lowerCaseSubCategory === ComponentType.AMC1.toLowerCase()) {
        finalPrompt = AMC1Prompt(aiPromptPayload);
        selectedComponent = ComponentType.AMC1;
      }
      if (lowerCaseSubCategory === ComponentType.PLAB1.toLowerCase()) {
        finalPrompt = PLAB1Prompt(aiPromptPayload);
        selectedComponent = ComponentType.PLAB1;
      }
      if (lowerCaseSubCategory === ComponentType.USMLE_STEP1.toLowerCase()) {
        finalPrompt = USMLEPrompt(aiPromptPayload);
        selectedComponent = ComponentType.USMLE_STEP1;
      }
      if (lowerCaseSubCategory === ComponentType.USMLE_STEP2.toLowerCase()) {
        finalPrompt = USMLEStep2CKPrompt(aiPromptPayload);
        selectedComponent = ComponentType.USMLE_STEP2;
      }
      if (lowerCaseSubCategory === ComponentType.RACP1.toLowerCase()) {
        finalPrompt = RACPPrompt(aiPromptPayload);
        selectedComponent = ComponentType.RACP1;
      }

      const aIPayload = {
        threadId: threadId,
        prompt: finalPrompt,
        component: selectedComponent,
      };

      const newPayload: any = {
        ...payload,
        quizCategory: category,
        questCategory: category,
        threadId,
        aIPayload,
        questionType: payload?.questionType,
        isGradeStrictly: false,
      };

      while (totalCount < questionNo) {
        const saveData = await this.addQuestionToDb(
          newPayload,
          file,
          coverImage,
        );
        const itemsFetched = saveData.totalQuestions;
        totalCount += itemsFetched;

        if (!threadId && saveData?.threadId) {
          threadId = saveData.threadId;
        }

        // Exit the loop once we've reached the exact number of required questions
        if (totalCount >= questionNo) {
          break;
        }

        // Wait for 2 minutes before the next batch
        await delay(120000);
      }

      return `${totalCount} questions generated`;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async USMLEPreview(
    payload: PlaygroundGeneralTriviaInput,
  ): Promise<PlaygroundReviewRes> {
    try {
      const {
        category,
        subcategory,
        prompt,
        subject,
        topics,
        outline,
        template,
        sampleQuestions,
      } = payload;
      const noOfOptions = Math.min(4);

      const response = [];

      let totalCount = 0;
      let threadId = payload.threadId;

      const aiPromptPayload = {
        prompt,
        noOfOptions,
        category,
        subcategory,
        subject,
        topics,
        outline,
        template,
        sampleQuestions,
        noOfQuestion: 10,
      };

      const lowerCaseSubCategory = payload?.subcategory?.toLowerCase();

      let finalPrompt: string;
      let selectedComponent: ComponentType;

      if (lowerCaseSubCategory === ComponentType.AMC1.toLowerCase()) {
        aiPromptPayload.subcategory = ComponentType.AMC1;
        finalPrompt = AMC1Prompt(aiPromptPayload);
        selectedComponent = ComponentType.AMC1;
      }
      if (lowerCaseSubCategory === ComponentType.PLAB1.toLowerCase()) {
        aiPromptPayload.subcategory = ComponentType.PLAB1;
        finalPrompt = PLAB1Prompt(aiPromptPayload);
        selectedComponent = ComponentType.PLAB1;
      }
      if (lowerCaseSubCategory === ComponentType.USMLE_STEP1.toLowerCase()) {
        aiPromptPayload.subcategory = ComponentType.USMLE_STEP1;
        finalPrompt = USMLEPrompt(aiPromptPayload);
        selectedComponent = ComponentType.USMLE_STEP1;
      }
      if (lowerCaseSubCategory === ComponentType.USMLE_STEP2.toLowerCase()) {
        aiPromptPayload.subcategory = ComponentType.USMLE_STEP2;
        finalPrompt = USMLEStep2CKPrompt(aiPromptPayload);
        selectedComponent = ComponentType.USMLE_STEP2;
      }
      if (lowerCaseSubCategory === ComponentType.RACP1.toLowerCase()) {
        aiPromptPayload.subcategory = ComponentType.RACP1;
        finalPrompt = RACPPrompt(aiPromptPayload);
        selectedComponent = ComponentType.RACP1;
      }

      const aIPayload = {
        threadId: threadId,
        prompt: finalPrompt,
        component: selectedComponent,
      };
      const generateQuestions = await this.aiAssistant(aIPayload, null);

      if (!threadId && generateQuestions?.threadId) {
        threadId = generateQuestions.threadId;
      }
      const itemsFetched = generateQuestions?.questions?.length;
      totalCount += itemsFetched;
      response.push(...generateQuestions?.questions);

      return {
        questions: response,
        threadId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Add Medsynopsis category
  async addMedSynopsisCategory(
    payload: PlaygroundMedsynopsisCaseInput[],
    categoryTitle: string,
    categoryImage?: FileUpload,
    categoryUUID?: string,
  ): Promise<void> {
    try {
      let imageUrl: string;

      if (!categoryUUID) {
        if (categoryImage) {
          // Save image to S3
          const { createReadStream } = await categoryImage;
          const stream = createReadStream();
          const { secure_url } = await this.awsS3Service.uploadImage(
            'medsynopsis-images',
            stream,
          );

          imageUrl = secure_url;
        }

        const createCategory = new this.medCategoryModel({
          coverImage: imageUrl ? imageUrl : null,
          title: categoryTitle,
        });

        await createCategory
          .save()
          .then(async (res) => {
            const newPayload = payload?.map((cases) => {
              return {
                ...cases,
                categoryUUID: res?.categoryUUID,
              };
            });
            await this.addMedSynopsisCase(newPayload, res?.categoryUUID);
          })
          .catch((error) => {
            throw new BadRequestException(
              error?.message || 'An unexpected error occured!',
            );
          });
      } else {
        const newPayload = payload?.map((cases) => {
          return {
            ...cases,
            categoryUUID,
          };
        });
        await this.addMedSynopsisCase(newPayload, categoryUUID);
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Create category case with bulk insert
  async addMedSynopsisCase(
    payload: PlaygroundMedsynopsisCaseInput[],
    categoryUUID: string,
  ): Promise<void> {
    try {
      const createdCases = await this.medSynopsisCaseModel.insertMany(payload);
      const caseUUIDs = createdCases.map((createdCase) => createdCase.caseUUID);
      await this.addCaseUUIDsToCategory(categoryUUID, caseUUIDs);
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Update method to add multiple case IDs to the category
  async addCaseUUIDsToCategory(
    categoryUUID: string,
    caseUUIDs: string[],
  ): Promise<void> {
    try {
      await this.medCategoryModel.findOneAndUpdate(
        { categoryUUID },
        { $push: { contents: { $each: caseUUIDs } } },
        { new: true },
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createMedsynopsis(
    payload: PlaygroundGeneralTriviaInput,
    categoryUUID?: string,
    categoryImage?: FileUpload,
    file?: FileUpload,
  ): Promise<any> {
    try {
      const { questionNo, category, subcategory, prompt } = payload;

      let totalCount = 0;
      let threadId = payload.threadId;
      const remainingQuestions = questionNo - totalCount;

      const aiPromptPayload = {
        prompt,
        department: subcategory,
        noOfQuestion: Math.min(remainingQuestions, 20),
      };
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const categoryType = category?.toLowerCase().trim();

      const aIPayload = {
        threadId: threadId,
        prompt: MedsynopsisPrompt(aiPromptPayload),
        category,
        component:
          categoryType === ComponentType.MEDSYNOPSIS.toLowerCase()
            ? ComponentType.MEDSYNOPSIS
            : null,
      };

      while (totalCount < questionNo) {
        const generateQuestions = await this.aiAssistant(aIPayload, file);

        if (generateQuestions.questions) {
          await this.addMedSynopsisCategory(
            generateQuestions?.questions,
            subcategory,
            categoryImage,
            categoryUUID,
          );
          const itemsFetched = generateQuestions?.questions?.length;
          totalCount += itemsFetched;

          if (!threadId && generateQuestions?.threadId) {
            threadId = generateQuestions.threadId;
          }
        }

        // Exit the loop once we've reached the exact number of required questions
        if (totalCount >= questionNo) {
          break;
        }
        // Wait for 2 minutes before the next batch
        await delay(120000);
      }

      return `${totalCount} questions generated`;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createMedsynopsisPreview(
    payload: PlaygroundGeneralTriviaInput,
    file?: FileUpload,
    categoryUUID?: string,
  ): Promise<any> {
    try {
      const { questionNo, category, subcategory, prompt } = payload;

      if (!categoryUUID) {
        const foundTitle = await this.medCategoryModel.findOne({
          title: subcategory,
        });
        if (foundTitle && !categoryUUID)
          throw new BadRequestException(
            'This category already exist! please provide the category UUID to proceed',
          );
      }

      let totalCount = 0;
      let threadId = payload.threadId;
      const response = [];

      const aiPromptPayload = {
        prompt,
        department: subcategory,
        noOfQuestion: 10,
      };

      const categoryType = category?.toLowerCase().trim();

      const aIPayload = {
        threadId: threadId,
        prompt: MedsynopsisPrompt(aiPromptPayload),
        category,
        component:
          categoryType === ComponentType.MEDSYNOPSIS.toLowerCase()
            ? ComponentType.MEDSYNOPSIS
            : null,
      };

      while (totalCount < questionNo) {
        const generateQuestions = await this.aiAssistant(aIPayload, file);

        if (!threadId && generateQuestions?.threadId) {
          threadId = generateQuestions.threadId;
        }

        const itemsFetched = generateQuestions?.questions?.length;
        totalCount += itemsFetched;
        response.push(...generateQuestions?.questions);

        // Exit the loop once we've reached the exact number of required questions
        if (totalCount >= questionNo) {
          break;
        }
      }

      return {
        questions: response,
        threadId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async addQuestionToDb(
    payload: PlaygroundAddToDb,
    outlineFile?: FileUpload,
    coverImage?: FileUpload,
  ): Promise<{ totalQuestions: number; response: any; threadId: string }> {
    try {
      const {
        quizCategory,
        questCategory,
        questionType,
        subcategory,
        aIPayload,
      } = payload;

      const foundQuiz = await this.quizModel.findOne({
        category: quizCategory,
      });

      const isMedscroll = Boolean(true);
      let totalQuestions = 0;
      let response;
      const threadId = payload.threadId;

      if (foundQuiz) {
        const generateQuestions = await this.aiAssistant(
          aIPayload,
          outlineFile,
        );

        if (generateQuestions?.questions) {
          totalQuestions = generateQuestions?.questions?.length;
          payload.threadId = payload.threadId
            ? payload.threadId
            : generateQuestions?.threadId;

          const newQuestionPayload = {
            quizUUID: foundQuiz?.quizUUID,
            questions: generateQuestions?.questions,
          };
          response = await this.addQuestionToQuiz(
            generateQuestions?.user?.userUUID,
            newQuestionPayload,
            questCategory,
            generateQuestions?.user,
            questionType,
            coverImage,
          )
            .then((res) => 'Questions created successfully!')
            .catch(async (error) => {
              throw new BadRequestException(error?.message);
            });
        }
      } else {
        const generateQuestions = await this.aiAssistant(
          aIPayload,
          outlineFile,
        );

        if (generateQuestions?.questions) {
          const firstIndex = generateQuestions?.questions[0];
          totalQuestions = generateQuestions?.questions?.length;

          const newQuizPayload = {
            description: quizCategory,
            topic: firstIndex?.topic,
            duration:
              quizCategory === 'Open Ended Question'
                ? '01:00'
                : quizCategory === 'Medical Exams' &&
                  (subcategory.toLowerCase() === 'usmle step 1' ||
                    subcategory.toLowerCase() === 'usmle step 2 ck')
                ? '01:30'
                : '00:30',
            point: 1,
            quizCategory,
            category: quizCategory,
            isMedscroll,
            timer: 'all time',
            questionType,
          };

          response = await this.quizService
            .createQuiz(
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

                return await this.addQuestionToQuiz(
                  generateQuestions?.user?.userUUID,
                  newQuestionPayload,
                  questCategory,
                  generateQuestions?.user,
                  questionType,
                  coverImage,
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
      }

      return {
        totalQuestions,
        response,
        threadId: threadId,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async addQuestionToQuiz(
    userUUID: string,
    { questions, quizUUID }: AddOpenEndedQuestionInput,
    category: string,
    foundUser?: any,
    questionType?: string,
    coverImage?: FileUpload,
  ) {
    try {
      const user =
        foundUser || (await this.userService.getUserByUUID(userUUID));
      // Check if any of the incoming questions already exist in the quiz
      const existingQuestions = await this.questionModel.find({
        quizUUID,
        question: { $in: questions?.map((item) => item.question) },
        mode: questionType?.toUpperCase(),
      }); // Using index

      // Remove the existing questions from the array
      const existingQuestionsText = existingQuestions?.map(
        (question) => question?.question,
      );
      const newQuestions = questions?.filter(
        (item) => !existingQuestionsText?.includes(item?.question),
      );

      // If there are no new questions to add, return an appropriate message
      if (newQuestions?.length === 0) {
        return { message: 'All provided questions already exist in the quiz' };
      }

      // Get quiz
      const quiz = await this.quizService.getQuiz(quizUUID);
      const subcategoriesMap = {}; // Map to track subcategories and IDs

      const documents = await Promise.all(
        newQuestions?.map(async (item) => {
          if (
            questionType?.toLowerCase()?.trimEnd().trimStart() !==
              PlaygroundQuestType.BROAD_SCOPE_QUIZ.toLowerCase()
                .trimEnd()
                .trimStart() &&
            questionType?.toLowerCase()?.trimEnd().trimStart() !==
              PlaygroundQuestType.MED_MATCH.toLowerCase()
                .trimEnd()
                .trimStart() &&
            questionType?.toLowerCase()?.trimEnd().trimStart() !==
              PlaygroundQuestType.PROBLEM_LIST_EVALUATION.toLowerCase()
                .trimEnd()
                .trimStart() &&
            questionType?.toLowerCase()?.trimEnd().trimStart() !==
              PlaygroundQuestType.DX_QUEST.toLowerCase()
                .trimEnd()
                .trimStart() &&
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
            questionType?.toLowerCase()?.trimEnd().trimStart() !==
              PlaygroundQuestType.BROAD_SCOPE_QUIZ.toLowerCase()
                .trimEnd()
                .trimStart() &&
            questionType?.toLowerCase()?.trimEnd().trimStart() !==
              PlaygroundQuestType.MED_MATCH.toLowerCase()
                .trimEnd()
                .trimStart() &&
            questionType?.toLowerCase()?.trimEnd().trimStart() !==
              PlaygroundQuestType.PROBLEM_LIST_EVALUATION.toLowerCase()
                .trimEnd()
                .trimStart() &&
            questionType?.toLowerCase()?.trimEnd().trimStart() !==
              PlaygroundQuestType.DX_QUEST.toLowerCase().trimEnd().trimStart()
          ) {
            throw new BadRequestException(
              'Cannot find answer in the options for one or more questions',
            );
          }

          const loweCategory = category?.toLowerCase();

          // Construct answer object
          const answer = {
            id: answerId || this.uid.rnd(),
            answer: item.answer,
            reference: item?.reference || null,
            answer_details: item?.answer_details || null,
          };

          let subcatId: string;
          let subCatCoverImage: string;

          const exisitingSubcat = await this.questionModel.findOne({
            'subcategory.subcat': item?.subcategory,
          });

          if (exisitingSubcat) {
            subcatId = exisitingSubcat?.subcategory?.id;
            if (coverImage && !exisitingSubcat?.subcategory?.coverImage) {
              const { createReadStream } = await coverImage;
              const stream = createReadStream();
              const { secure_url } = await this.awsS3Service.uploadImage(
                'logo-images',
                stream,
              );

              subCatCoverImage = secure_url;
            }
          } else {
            // Generate or retrieve subcategory ID
            subcatId = subcategoriesMap[item?.subcategory];
            if (!subcatId) {
              subcatId = this.uid.rnd(); // Generate unique ID for subcategory
              subcategoriesMap[item?.subcategory] = subcatId;
              if (coverImage && !exisitingSubcat?.subcategory?.coverImage) {
                const { createReadStream } = await coverImage;
                const stream = createReadStream();
                const { secure_url } = await this.awsS3Service.uploadImage(
                  'logo-images',
                  stream,
                );

                subCatCoverImage = secure_url;
              }
            }
          }

          const newSubcategory = {
            id: subcatId,
            subcat: item?.subcategory,
            coverImage: subCatCoverImage,
          };

          // Construct the transformed question object
          const question: QuestionEntity = {
            ...item,
            quizUUID,
            userId: user._id,
            images: item?.imageUrls || [],
            question: item.question,
            options,
            hasOptions: loweCategory === 'open ended question' ? false : true,
            answer: answer,
            category: category,
            subcategory:
              loweCategory === 'medical exams' ||
              loweCategory === 'open ended question' ||
              loweCategory === 'basic sciences' ||
              loweCategory === 'clinical sciences' ||
              loweCategory === 'medical trivia'
                ? newSubcategory
                : null,
            quizCategoryId: quiz?.quizCategory?.customCatId,
            topic: item?.topic || null,
            subtopic: item?.subtopic || null,
            subject: item?.subject || null,
            specialty: item?.specialty || null,
            subspecialty: item?.subspecialty || null,
            system: item?.system || null,
            level:
              typeof item?.level === 'string'
                ? item?.level === 'beginner'
                  ? 1
                  : item?.level === 'intermediate'
                  ? 2
                  : item?.level === 'advance'
                  ? 3
                  : 0
                : item?.level,
            mode:
              questionType?.toUpperCase() === QuestionType.DX_QUEST
                ? QuestionType.DX_QUEST
                : questionType?.toUpperCase() === QuestionType.BROAD_SCOPE_QUIZ
                ? QuestionType.BROAD_SCOPE_QUIZ
                : questionType?.toUpperCase() === QuestionType.MED_MATCH
                ? QuestionType.MED_MATCH
                : questionType?.toUpperCase() ===
                  QuestionType.PROBLEM_LIST_EVALUATION
                ? QuestionType.PROBLEM_LIST_EVALUATION
                : questionType?.toUpperCase() === QuestionType.USMLE_STEP1
                ? QuestionType.USMLE_STEP1
                : questionType?.toUpperCase() === QuestionType.USMLE_STEP2
                ? QuestionType.USMLE_STEP2
                : questionType?.toUpperCase() === QuestionType.PLAB1
                ? QuestionType.PLAB1
                : questionType?.toUpperCase() === QuestionType.AMC1
                ? QuestionType.AMC1
                : questionType?.toUpperCase() === QuestionType.RACP1
                ? QuestionType.RACP1
                : questionType?.toUpperCase() === QuestionType.RACGP_AKT
                ? QuestionType.RACGP_AKT
                : questionType?.toUpperCase() === QuestionType.RACGP_KFP
                ? QuestionType.RACGP_KFP
                : questionType?.toUpperCase() === QuestionType.NCLEX_RN
                ? QuestionType.NCLEX_RN
                : questionType?.toUpperCase() === QuestionType.NCLEX_PN
                ? QuestionType.NCLEX_PN
                : questionType?.toUpperCase() === QuestionType.MULTICHOICE
                ? QuestionType.MULTICHOICE
                : questionType?.toUpperCase() === QuestionType.MEDSYNOPSIS
                ? QuestionType.MEDSYNOPSIS
                : null,
          };

          return question;
        }),
      );

      // Insert only the new questions
      await this.questionModel.insertMany(documents);

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

  //upload image
  async uploadImage(destination: string, file?: FileUpload): Promise<string> {
    try {
      let imageUrl: string;

      if (file) {
        // Save image to S3
        const { createReadStream } = await file;
        const stream = createReadStream();
        const { secure_url } = await this.awsS3Service.uploadImage(
          destination,
          stream,
        );

        imageUrl = secure_url;
      }

      return imageUrl;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async groupQuestions(file?: FileUpload): Promise<QuestionDocument[]> {
    const aIPayload = {
      threadId: '',
      prompt: groupQuestionsPrompt(),
      component: ComponentType.GROUP_QUESTIONS,
    };

    const generateQuestions = await this.aiAssistant(aIPayload, file);

    return generateQuestions.questions;
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

  async convertDocxToMarkdown(file: FileUpload): Promise<string> {
    try {
      const { createReadStream } = file;
      const stream = createReadStream();

      // Read file into a buffer
      const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });

      // Convert DOCX to HTML
      const { value: html } = await mammoth.convertToHtml({
        buffer: fileBuffer,
      });

      // Convert HTML to Markdown
      const markdown = this.turndownService.turndown(html);
      return markdown;
    } catch (error) {
      console.error('Error converting DOCX to Markdown:', error);
      throw new BadRequestException('Failed to convert DOCX to Markdown');
    }
  }
}
