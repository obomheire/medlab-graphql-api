import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ExamPrepConfigDto } from '../dto/exam-prep.input';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';
import {
  ExamPrepConfigDocument,
  ExamPrepConfigEntity,
} from '../entity/exam-prep.config.entity';
import {
  generateQuestionsPrompt,
  learnPathAIPrompt,
} from '../constant/exam-prep.constant';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { ThreadMessageInput } from 'src/llm-providers/openAI/dto/assistant.input';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import { QuestionsRes } from '../types/exam-prep.type';
import {
  LearningPathDocument,
  LearningPathEntity,
} from '../entity/learningPath.entity';
import ShortUniqueId from 'short-unique-id';
import { UserDocument } from 'src/user/entity/user.entity';

@Injectable()
export class ExamPrepService {
  private readonly uid = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(LearningPathEntity.name)
    private readonly learningPathModel: Model<LearningPathDocument>,
    @InjectModel(ExamPrepConfigEntity.name)
    private readonly examPrepConfigModel: Model<ExamPrepConfigDocument>,
    private readonly httpService: HttpService,
    private asstThreadService: AsstThreadService,
  ) {}

  async createOrUpdateExamPrepConfiguration(
    payload: ExamPrepConfigDto,
    userUUID: string,
    examCurriculumFile: FileUpload,
    examQuestionsFile: FileUpload,
  ): Promise<string> {
    try {
      let examCurriculumContent;
      let examQuestionContent;

      // Extract curriculum content if a file is provided or if the link/text is valid
      if (examCurriculumFile && !payload?.examCurriculumLinkOrText) {
        examCurriculumContent = await this.extractUploadFileText(
          examCurriculumFile,
        );
      } else if (
        payload?.examCurriculumLinkOrText &&
        !examCurriculumFile &&
        payload?.examCurriculumLinkOrText?.toLowerCase().trimEnd() !==
          'Maybe later'.toLowerCase().trimEnd()
      ) {
        examCurriculumContent = await this.fetchAndProcessContent(
          payload?.examCurriculumLinkOrText,
        );
      }

      // Extract questions content if a file is provided
      if (examQuestionsFile) {
        examQuestionContent = await this.extractUploadFileText(
          examQuestionsFile,
        );
      }

      // Check if a configuration already exists for the user
      const existingConfig = await this.examPrepConfigModel.findOne({
        userUUID,
      });

      if (existingConfig) {
        // Update the existing configuration
        existingConfig.examCurriculumContent =
          examCurriculumContent || existingConfig.examCurriculumContent;
        existingConfig.examQuestionContent =
          examQuestionContent || existingConfig.examQuestionContent;
        existingConfig.examName = payload.examName || existingConfig.examName;
        existingConfig.examDate = payload.examDate || existingConfig.examDate;
        existingConfig.examKnowledgeLevel =
          payload.examKnowledgeLevel || existingConfig.examKnowledgeLevel;
        existingConfig.examCurriculumFile =
          payload.examCurriculumLinkOrText || existingConfig.examCurriculumFile;
        existingConfig.sampleQuestions =
          payload.sampleQuestions || existingConfig.sampleQuestions;

        return await existingConfig
          .save()
          .then(() => 'Exam prep configuration updated successfully!')
          .catch((error) => {
            throw new BadRequestException(error?.message);
          });
      } else {
        // Create a new configuration if none exists
        const saveConfig = new this.examPrepConfigModel({
          ...payload,
          userUUID,
          examCurriculumContent,
          examQuestionContent,
        });

        return await saveConfig
          .save()
          .then(() => 'Exam prep configuration saved successfully!')
          .catch((error) => {
            throw new BadRequestException(error?.message);
          });
      }
    } catch (error) {
      throw new HttpException(error?.message, error?.code);
    }
  }

  //Get exisiting exam prep configuration
  async getExamPrepConfig(userUUID: string): Promise<ExamPrepConfigDocument> {
    try {
      const foundConfig = await this.examPrepConfigModel.findOne({ userUUID });
      if (foundConfig) return foundConfig;
      return null;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Generate Learning Path
  async generateExamLearningPath(
    user: UserDocument,
    threadId?: string,
  ): Promise<string> {
    try {
      const threadMessageInput: ThreadMessageInput = {
        threadId: '',
        message: '',
      };

      const configData = await this.getExamPrepConfig(user.userUUID);
      threadMessageInput.threadId = threadId;
      threadMessageInput.message = learnPathAIPrompt(configData);

      const {
        message: content,
        threadId: chatThreadId,
        messageId,
      } = await this.asstThreadService
        .addMessage(
          user,
          threadMessageInput,
          ComponentType.EXAMPREP,
          null,
          null,
          null,
        )
        .catch((error) => {
          console.log('the error', error);
        });

      if (content) {
        configData.threadId = chatThreadId;
        configData.markModified('threadId');
        await configData.save();

        // const summarizedContent = JSON.parse(content);

        //   const foundLearningPath = await this.getExamPrepLearningPath(userUUID);

        const foundLearningPath = await this.getExamPrepLearningPath(
          user.userUUID,
        );

        if (foundLearningPath) {
          foundLearningPath.title = configData?.examName;
          foundLearningPath.learningPathContent = content?.learningPathContent;
          await foundLearningPath
            .save()
            .then((res) => 'Learning path updated successfully')
            .catch((error) => {
              throw new BadRequestException(error?.message);
            });
        } else {
          const saveLearningPath = new this.learningPathModel({
            learningPathContent: content,
            userUUID: user.userUUID,
            threadId: chatThreadId,
          });

          await saveLearningPath
            .save()
            .then((response: any) => {
              if (response) {
                return 'Lerning path created successfully';
              }
            })
            .catch((error) => {
              throw new BadRequestException(error?.message);
            });
        }
        return content;
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async getExamPrepLearningPath(
    userUUID: string,
  ): Promise<LearningPathDocument> {
    try {
      const foundPath = await this.learningPathModel
        .findOne({ userUUID })
        .exec();
      return foundPath;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Generate questions
  async generateExamQuestions(
    user: UserDocument,
    examLearningPathThreadId?: string,
    limit?: number,
  ): Promise<QuestionsRes> {
    try {
      const threadMessageInput: ThreadMessageInput = {
        threadId: '',
        message: '',
      };

      // const configData = await this.getExamPrepConfig(userUUID);
      threadMessageInput.threadId = examLearningPathThreadId;
      threadMessageInput.message = generateQuestionsPrompt(limit);

      const {
        message: content,
        threadId: chatThreadId,
        messageId,
      } = await this.asstThreadService
        .addMessage(
          user,
          threadMessageInput,
          ComponentType.EXAMPREP,
          null,
          null,
          null,
        )
        .catch((error) => {
          console.log('the error', error);
        });

      const result = JSON.parse(content);

      const outputResult = {
        title: result?.title,
        questions: result?.questions?.map((res) => {
          return {
            ...res,
            questionId: this.uid.rnd(),
          };
        }),
      };
      return outputResult;
    } catch (error) {}
  }

  async extractUploadFileText(file: FileUpload): Promise<string> {
    try {
      const { createReadStream, filename } = await file;
      const fileExtension = path.extname(filename);
      const stream = createReadStream();
      const chunks: Buffer[] = [];

      if (
        !fileExtension?.includes('.pdf') &&
        !fileExtension?.includes('.doc') &&
        !fileExtension?.includes('.docx')
      ) {
        throw new BadRequestException('File type must be of type pdf or word');
      }

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      switch (fileExtension) {
        case '.pdf': {
          const { text } = await pdfParse(buffer);
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

  async fetchAndProcessContent(url: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );
      const contentType2 = response.headers['content-type'];
      const contentType = response.config['url'];

      //   if (!contentType?.includes(".pdf") && !contentType?.includes(".doc") && !contentType?.includes(".docx")) {
      //     throw new BadRequestException("File type must be of type pdf or word");
      // }

      if (contentType.includes('.docx') || contentType.includes('.doc')) {
        const docxContent = await mammoth.extractRawText({
          buffer: response.data,
        });
        return docxContent.value;
      } else if (contentType.includes('.pdf')) {
        const pdfContent = await this.extractPdfText(response.data);
        return pdfContent;
      } else {
        return response?.data;
      }
    } catch (error) {
      throw new HttpException(error?.message, error?.code);
    }
  }

  private async extractPdfText(pdfBuffer: Buffer): Promise<string> {
    try {
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    } catch (error) {
      throw new HttpException(error?.message, error?.code);
    }
  }

  // Delete user's exam prep
  async deleteUserExamPrep(userUUID: string) {
    try {
      const examPrep = await this.examPrepConfigModel
        .deleteMany({
          userUUID,
        })
        .exec(); // add index
      return {
        count: examPrep.deletedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete user's learning path
  async deleteUserLearningPath(userUUID: string) {
    try {
      const learningPath = await this.learningPathModel
        .deleteMany({
          userUUID,
        })
        .exec(); // add index
      return {
        count: learningPath.deletedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
