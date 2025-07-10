import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClinicalExamTutorialDocument,
  ClinicalExamTutorialEntity,
} from '../entity/clinicalExams.tutorial.entity';
import { FileUpload } from 'graphql-upload-ts';
import * as mammoth from 'mammoth';
import TurndownService from 'turndown';
import {
  GetTutorialByCatNameRes,
  UploadTutorialArticleRes,
} from '../types/clinicalExams.types';
import ShortUniqueId from 'short-unique-id';
import {
  AddTutorialSectionQuizDto,
  IncomingTutorialInput,
} from '../dto/tutorial.dto';
import { TutorialStatus } from '../enum/clinicalExam.enum';
import { UserDocument } from 'src/user/entity/user.entity';
import { SaveUserQuizScoreService } from 'src/quiz/service/saveUserQuizScore.service';
import {
  UserScoreInput,
  UserScoreTutorialInput,
} from 'src/quiz/dto/userScore.input';
import { UserQuizScoreEntity } from 'src/quiz/entity/userQuizScoreEntity';
import { UserScoreType } from 'src/quiz/enum/quiz.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClinicalExamTutorialService {
  private uuuid = new ShortUniqueId({ length: 16 });
  private turndownService: TurndownService;
  constructor(
    @InjectModel(ClinicalExamTutorialEntity.name)
    private readonly clinicalExamTutorialModel: Model<ClinicalExamTutorialEntity>,
    private readonly saveUserQuizScoreService: SaveUserQuizScoreService,
  ) {
    this.turndownService = new TurndownService();
  }

  // Create a new tutorial
  async createClinicalExamTutorial(
    category: string,
    sectionTitle: string,
  ): Promise<ClinicalExamTutorialEntity> {
    try {
      const foundSection = await this.clinicalExamTutorialModel.findOne({
        category,
        sectionTitle,
      });
      if (foundSection) {
        throw new BadRequestException(
          'category and sectionTitle already exists',
        );
      }

      return await this.clinicalExamTutorialModel.create({
        category,
        sectionTitle,
      });

      // if (!foundSection) {
      //   const foundCategory = await this.clinicalExamTutorialModel.findOne({
      //     category,
      //   });
      //   if (foundCategory) {
      //     foundCategory.sectionTitle = sectionTitle;
      //     foundCategory.markModified('sectionTitle');
      //     await foundCategory.save();
      //     return foundCategory;
      //   } else {
      //     return this.clinicalExamTutorialModel.create({
      //       category,
      //       sectionTitle,
      //     });
      //   }
      // }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //method for uploading a section to a tutorial and should be the first flow
  async addTutorialSectionNoteAndVideo(
    categoryName: string,
    sectionTitle: string,
    title: string,
    note: string, //this is the file for the transcript
    videoUrl: string, //this is the video url for the section
  ): Promise<UploadTutorialArticleRes> {
    try {
      const tutorial = await this.clinicalExamTutorialModel.findOne({
        category: { $regex: new RegExp(categoryName, 'i') },
        sectionTitle: { $regex: new RegExp(sectionTitle, 'i') },
      });
      if (tutorial) {
        const payload = {
          title,
          note,
          videoUrl,
          sectionUUID: this.uuuid.randomUUID(),
        };
        const savedTutorial =
          await this.clinicalExamTutorialModel.findOneAndUpdate(
            {
              category: { $regex: new RegExp(categoryName, 'i') },
              sectionTitle: { $regex: new RegExp(sectionTitle, 'i') },
            },
            { $push: { section: payload } },
            { new: true },
          );
        return {
          videoUrl,
          note,
          sectionUUID:
            savedTutorial.section[savedTutorial.section.length - 1].sectionUUID,
          title: savedTutorial.section[savedTutorial.section.length - 1].title,
        };
      } else {
        throw new BadRequestException(
          'Tutorial not found for the provided category and sectionTitle',
        );
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //method for adding a quiz to a section
  async addTutorialSectionQuiz(
    payload: AddTutorialSectionQuizDto,
  ): Promise<ClinicalExamTutorialEntity> {
    const { category, sectionTitle, quizzes } = payload;
    const tutorial = await this.clinicalExamTutorialModel.findOne({
      category: { $regex: new RegExp(category, 'i') },
      sectionTitle: { $regex: new RegExp(sectionTitle, 'i') },
    });
    if (tutorial) {
      const fomartedQuizzes = quizzes.map((quiz) => ({
        question: quiz.question,
        answer: quiz.answer,
        answer_details: quiz.answer_details,
        options: [quiz.optionA, quiz.optionB, quiz.optionC, quiz.optionD],
        type: quiz.type,
        questionUUID: uuidv4(),
      }));
      tutorial.quiz.push(...fomartedQuizzes);
      tutorial.markModified('quiz');
      await tutorial.save();
      return tutorial;
    } else {
      throw new BadRequestException(
        'Tutorial not found for the provided category and sectionTitle',
      );
    }
  }

  //method for adding a slide to a section article
  async addTutorialSectionArticleSlide(
    category: string,
    sectionTitle: string,
    subSectionTitle: string,
    slides: string[],
  ): Promise<ClinicalExamTutorialEntity> {
    const tutorial = await this.clinicalExamTutorialModel.findOne({
      category: { $regex: new RegExp(category, 'i') },
      sectionTitle: { $regex: new RegExp(sectionTitle, 'i') },
    });
    if (tutorial) {
      tutorial?.section?.filter((section) => {
        if (section?.title?.toLowerCase() === subSectionTitle.toLowerCase()) {
          section.slides.push(...slides);
          return section;
        }
      });
      tutorial.markModified('section');
      await tutorial.save();
      return tutorial;
    } else {
      throw new BadRequestException(
        'Tutorial not found for the provided category and sectionTitle',
      );
    }
  }

  //method for getting a tutorial by category name
  async getTutorialByCatName(
    catName: string,
    user: UserDocument,
    status?: TutorialStatus,
    search?: string,
    page = 1,
    limit = 100,
  ): Promise<GetTutorialByCatNameRes[]> {
    try {
      const matchQuery: any = {};
      if (catName) {
        matchQuery['category'] = { $regex: new RegExp(catName, 'i') };
      }

      if (search) {
        matchQuery['sectionTitle'] = { $regex: new RegExp(search, 'i') };
      }

      const result = await this.clinicalExamTutorialModel
        .find(matchQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ order: 1 });

        result.forEach((tutorial) => {
          tutorial?.section?.forEach((section) => {
            section.userData = section.userData?.filter(
              (userRecord) => userRecord?.user?.userUUID === user?.userUUID,
            );
          });
        });

  
      if (status) {
        const foundSectionIDs: string[] = [];
        const allStatus: string[] = [];

        result.forEach((tutorial) => {
          tutorial?.section?.forEach((section) => {
            section?.userData?.forEach((userRecord) => {
              if (
                userRecord?.user?.userUUID === user?.userUUID &&
                userRecord?.readingStatus?.toLowerCase() ===
                  status.toLowerCase()
              ) {
                allStatus.push(userRecord.readingStatus);
                foundSectionIDs.push(section.sectionUUID);
              }
            });
          });
        });

        
  
        const filtered = result
          .map((tutorial) => {
            const filteredSections = tutorial.section?.filter((section) =>
              foundSectionIDs.includes(section.sectionUUID),
            );

            const progress = allStatus.includes(TutorialStatus.IN_PROGRESS)
              ? TutorialStatus.IN_PROGRESS
              : allStatus.includes(TutorialStatus.COMPLETED) &&
                !allStatus.includes(TutorialStatus.IN_PROGRESS) &&
                !allStatus.includes(TutorialStatus.NOT_STARTED)
              ? TutorialStatus.COMPLETED
              : TutorialStatus.NOT_STARTED;

            return {
              ...tutorial.toObject(),
              section: filteredSections,
              progress,
            };
          })
          .filter(
            (tutorial) => tutorial.section && tutorial.section.length > 0,
          );

        const updatedTutorials = await Promise.all(
          filtered.map(async (tutorial: any) => {
            const quiz = await this.getUserScores(
              user,
              tutorial.category,
              tutorial.sectionTitle,
            );

            return {
              ...tutorial,
              quizResult: quiz,
            };
          }),
        );

        return updatedTutorials;
      } else {
        const allStatus: string[] = [];

        result.forEach((tutorial) => {
          tutorial?.section?.forEach((section) => {
            section?.userData?.forEach((userRecord) => {
              allStatus.push(userRecord.readingStatus);
            });
          });
        });

  
        const updatedTutorials = await Promise.all(
          result.map(async (tutorial: any) => {
            const quiz = await this.getUserScores(
              user,
              tutorial.category,
              tutorial.sectionTitle,
            );

            const progress = allStatus.includes(TutorialStatus.IN_PROGRESS)
              ? TutorialStatus.IN_PROGRESS
              : allStatus.includes(TutorialStatus.COMPLETED) &&
                !allStatus.includes(TutorialStatus.IN_PROGRESS) &&
                !allStatus.includes(TutorialStatus.NOT_STARTED)
              ? TutorialStatus.COMPLETED
              : TutorialStatus.NOT_STARTED;

            return {
              ...tutorial.toObject(),
              quizResult: quiz,
              progress,
            };
          }),
        );

        return updatedTutorials;
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //method for getting a tutorial by tutorial UUID
  async getTutorialByTutorialUUID(
    tutorialUUID: string,
  ): Promise<ClinicalExamTutorialDocument[]> {
    try {
      return this.clinicalExamTutorialModel.find({ tutorialUUID });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //method for getting a tutorial by category name and section title
  async getTutorialByCatNameAndSectionTitle(
    category: string,
    sectionTitle: string,
  ): Promise<ClinicalExamTutorialDocument> {
    try {
      return this.clinicalExamTutorialModel.findOne({
        category,
        sectionTitle,
      });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Section for changing an article reading status
  async changeArticleReadingStatus(
    tutorialUUID: string,
    sectionTitle: string,
    articleUUID: string,
    userData: UserDocument,
    status: TutorialStatus,
  ): Promise<string> {
    try {
      const tutorial = await this.getTutorialByCatNameAndSectionTitle(
        tutorialUUID,
        sectionTitle,
      );

      if (!tutorial) {
        throw new BadRequestException(
          'Tutorial not found for the provided category and sectionTitle',
        );
      }

      // Ensure we correctly find the matching section
      tutorial.section?.forEach((section) => {
        if (section.sectionUUID === articleUUID) {
          if (!section.userData) {
            section.userData = [];
          }

          const existingUser = section.userData.find(
            (entry) => entry?.user?.userUUID === userData?.userUUID,
          );

          if (existingUser) {
            // Update status if user exists
            existingUser.readingStatus = status;
          } else {
            // Add new userData if user not found
            section.userData.push({
              user: userData,
              readingStatus: status,
              articleUUID: articleUUID,
            });
          }
        }
      });

      tutorial.markModified('section');
      await tutorial.save();
      return 'success';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //method for getting a tutorial by category name
  async getTutorial(
    user: UserDocument,
    catName: string,
    sectionTitle: string,
    status?: TutorialStatus,
    search?: string,
    page = 1,
    limit = 1000,
  ): Promise<GetTutorialByCatNameRes> {
    try {
      const matchQuery: any = {
        category: { $regex: new RegExp(catName, 'i') },
        sectionTitle: { $regex: new RegExp(sectionTitle, 'i') },
      };

      const result = await this.clinicalExamTutorialModel.findOne(matchQuery).sort({ order: 1 });
      if (!result) throw new BadRequestException('Tutorial not found');

      result?.section?.forEach((section) => {
        section.userData = section.userData?.filter(
          (userRecord) => userRecord?.user?.userUUID === user?.userUUID,
        );
      });
      
  
      let sections = result.section || [];

      // Apply search filter
      if (search) {
        sections = sections.filter((section) =>
          section.title.toLowerCase().includes(search.toLowerCase()),
        );
      }

      // Filter by status (if provided)
      if (status) {
        sections = sections.filter((section) =>
          section.userData?.some(
            (userRecord) =>
              userRecord?.user?.userUUID === user?.userUUID &&
              userRecord?.readingStatus?.toLowerCase() === status.toLowerCase(),
          ),
        );
      }

      // Collect quiz results and attach to section.userData AND collect for top-level response
      const quizResult: any[] = [];
      const enrichedSections = await Promise.all(
        sections.map(async (section) => {
          const quiz = await this.getUserScores(
            user,
            result.category,
            result.sectionTitle,
          );

          // Attach inside userData for each matching user
          section.userData?.forEach((userRecord) => {
            if (
              userRecord?.user?.userUUID === user?.userUUID &&
              userRecord?.articleUUID === section.sectionUUID
            ) {
              userRecord.quizResult = quiz;
            }
          });

          quizResult.push({
            sectionUUID: section.sectionUUID,
            title: section.title,
            quiz,
          });

          return section;
        }),
      );

      const data = {
        ...result.toObject(),
        section: enrichedSections,
        quizResult: quizResult[0]?.quiz,
        progress: null,
      };

      return data;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async saveUserQuizScore(
    userQuizPayload: UserScoreTutorialInput,
    user: UserDocument,
  ): Promise<string> {
    try {
      if (
        userQuizPayload?.type.toLowerCase() ===
        UserScoreType.MULTIPLE_CHOICE.toLowerCase()
      ) {
        const newPayload = {
          ...userQuizPayload,
          optionSelected: userQuizPayload?.optionSelected[0],
        };
        this.saveUserQuizScoreService.saveUserScoreMCQ(newPayload, user);
      } else {
        this.saveUserQuizScoreService.saveUserScoreOpenEnded(
          userQuizPayload,
          user,
        );
      }
      return 'success';
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //method for getting the user score by type
  async getUserScoreByType(
    user: UserDocument,
    type: UserScoreType,
    category?: string,
    subcategory?: string, // this is the sectionTitle of the tutorial
    sectionTitle?: string, // this is the title inside the tutorial section array. example: "Section 1.1"
  ): Promise<UserQuizScoreEntity[]> {
    try {
      return this.saveUserQuizScoreService.getUserScoreByType(
        user,
        type,
        category,
        subcategory,
        sectionTitle,
      );
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
  //method for getting the user scores
  async getUserScores(
    user: UserDocument,
    category?: string,
    subcategory?: string, // this is the sectionTitle of the tutorial
    sectionTitle?: string, // this is the title inside the tutorial section array. example: "Section 1.1"
  ): Promise<UserQuizScoreEntity[]> {
    try {
      return this.saveUserQuizScoreService.getUserScores(
        user,
        category,
        subcategory,
        sectionTitle,
      );
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for saving upcoming event
  async saveUpcomingTutorial(
    payload: IncomingTutorialInput,
  ): Promise<ClinicalExamTutorialEntity> {
    try {
      return await this.clinicalExamTutorialModel.create({
        category: payload?.category,
        sectionTitle: payload?.sectionTitle,
        upcomingTutDate: payload?.upcomingTutDate,
        upcomingTutDuration: payload?.upcomingTutDuration,
        isUpcoming: true,
      });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for getting upcoming tutorial
  async getUpcomingTutorials(): Promise<ClinicalExamTutorialEntity[]> {
    try {
      const result = await this.clinicalExamTutorialModel.find({
        isUpcoming: true,
      });

      return result;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method for deleting upcoming tutorial
  async deleteUpcomingTutorial(
    tutorialUUID: string,
    sectionTitle: string,
  ): Promise<string> {
    try {
      const matchQuery: any = {};
      if (tutorialUUID) {
        matchQuery['tutorialUUID'] = tutorialUUID;
      } else {
        matchQuery['isUpcoming'] = true;
      }
      if (sectionTitle) {
        matchQuery['sectionTitle'] = sectionTitle;
      }
      return await this.clinicalExamTutorialModel.findOneAndDelete(matchQuery);
    } catch (error) {
      throw new BadRequestException(error?.message);
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
