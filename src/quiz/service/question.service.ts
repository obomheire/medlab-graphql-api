import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QuestionDocument, QuestionEntity } from '../entity/questions.entity';
import mongoose, { Model } from 'mongoose';
import {
  ClinicialSubspecialtyRes,
  GenerateOpenEndedQuesRes,
  GetMyQuesRes,
  GetQuestionsRes_v2,
  GetSystemsRes,
  MedicalExamsSubjectsRes,
  OpenEndedQuesCount,
  Pagination,
  ReviewOpenEndedQuesRes,
  SubcategoryRes,
  SubmitQRes,
  SubmitVoteRes,
  UploadQsImageRes,
} from '../types/quiz.types';
import { CryptoService } from 'src/auth/service/crypto.service';
import { UserService } from 'src/user/service/user.service';
import {
  GetAllCaseQuestionsQuery,
  GetQuesToReviewInput,
  LeaderboardInput,
  ResponseInput,
  SubmitResInput,
  VoteInput,
} from '../dto/question.input';
import shuffle from 'lodash.shuffle';
import { LeaderBoardRes } from 'src/user/types/user.types';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { ObjectId } from 'mongodb';
import { QuizService } from './quiz.service';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { UpdateQuestion } from '../dto/quiz.input';
import { CaseDocument, CaseEntity } from '../entity/case.entity';
import {
  convertTimeToSeconds,
  exclude,
  getPagination,
} from 'src/utilities/service/helpers.service';
import {
  imageUrlConstant,
  subcategory,
  subcatImage,
} from 'src/utilities/constant/utils.costant';
import { ConfigService } from '@nestjs/config';
import { CategoryType, LeaderBoardEventsType } from '../enum/quiz.enum';
import {
  GetQuestionsParam,
  SystemTopics,
} from 'src/utilities/interface/interface';
import { LeaderBoardService } from './leaderboard.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserDocument } from 'src/user/entity/user.entity';
import { CACHE_KEY } from 'src/cache/constant/constant';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class QuestionService {
  constructor(
    private configService: ConfigService,
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(CaseEntity.name)
    private readonly caseModel: Model<CaseDocument>,
    private readonly userService: UserService,
    private readonly quizService: QuizService,
    private readonly cryptoService: CryptoService,
    private readonly awsS3Service: AwsS3Service,
    private readonly leaderBoardService: LeaderBoardService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Get questions by subcategory
  async getSubategory(category?: CategoryType): Promise<SubcategoryRes[]> {
    try {
      const aggregatePipeline: any = [
        {
          $match: {
            subcategory: { $ne: null }, // Filter out non-existing subcategory values
            reviewed: true,
            category: {
              $nin: [
                'Open Ended',
                'Dx Quest',
                'Open Ended 2',
                'Med-Match',
                'Med Match',
                'Problem Solving Evaluation',
                'Open Ended Question',
              ],
              $in: [category || CategoryType.MEDICAL_TRIVIA], // Include category or 'Medical Trivia'
            },
          },
        },
        {
          $group: {
            _id: '$subcategory',
            totalNumber: { $sum: 1 },
          },
        },
        {
          $addFields: {
            subcatLower: { $toLower: '$_id.subcat' },
          },
        },
        {
          $sort: { subcatLower: 1 }, // Sort by lowercase subcat field in ascending order
        },
        {
          $project: {
            _id: 0,
            subcategory: '$_id',
            totalNumber: 1,
          },
        },
      ];

      const subcategories = await this.questionModel
        .aggregate(aggregatePipeline)
        .exec();

      // Add coverImage based on subcategory IDs
      subcategories.forEach((item) => {
        const foundImage = imageUrlConstant.find(
          (url) =>
            url.name.toLowerCase() === item.subcategory.subcat.toLowerCase(),
        );
        item.coverImage = foundImage ? foundImage.image : null; // Assign coverImage if found
      });

      return subcategories;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get questions by subspecialties
  async getSubSpecialty(
    category?: CategoryType,
    specialty?: string,
  ): Promise<ClinicialSubspecialtyRes[]> {
    try {
      const aggregatePipeline: any = [
        {
          $match: {
            subspecialty: { $ne: null }, // Filter out non-existing subcategory values
            reviewed: true,
            category: {
              $nin: [
                'Open Ended',
                'Dx Quest',
                'Open Ended 2',
                'Med-Match',
                'Med Match',
                'Problem Solving Evaluation',
                'Open Ended Question',
              ],
              $in: [category || CategoryType.MEDICAL_TRIVIA], // Include category or 'Medical Trivia'
            },
            ...(specialty && { specialty }), // Add specialty filter dynamically if provided
          },
        },
        {
          $group: {
            _id: '$subspecialty',
            totalNumber: { $sum: 1 },
          },
        },
        {
          $sort: { subspecialty: 1 }, // Sort by lowercase subcategory field in ascending order
        },
        {
          $project: {
            _id: 0,
            subspecialty: '$_id',
            totalNumber: 1,
          },
        },
      ];

      const subspecialties = await this.questionModel
        .aggregate(aggregatePipeline)
        .exec();

      // Add coverImage based on subcategory IDs
      subspecialties.forEach((item) => {
        const foundImage = imageUrlConstant.find(
          (url) => url.name.toLowerCase() === item.subspecialty.toLowerCase(),
        );
        item.coverImage = foundImage ? foundImage.image : null; // Assign coverImage if found
      });

      return subspecialties;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Method for getting subjects by subcategory
  async getSubCategorySubjects(
    category: CategoryType,
    subcategory: string,
  ): Promise<MedicalExamsSubjectsRes[]> {
    try {
      const aggregatePipeline: any = [
        {
          $match: {
            reviewed: true,
            'subcategory.subcat': subcategory,
            category: {
              $nin: [
                'Open Ended',
                'Dx Quest',
                'Open Ended 2',
                'Med-Match',
                'Med Match',
                'Problem Solving Evaluation',
                'Open Ended Question',
              ],
              $in: [category || CategoryType.MEDICAL_TRIVIA],
            },
            subject: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$subject',
            totalNumber: { $sum: 1 },
          },
        },
        {
          $sort: { subject: 1 },
        },
        {
          $project: {
            _id: 0,
            subject: '$_id',
            subcategory: subcategory,
            category: category,
            totalNumber: 1,
          },
        },
      ];

      const subjects = await this.questionModel
        .aggregate(aggregatePipeline)
        .exec();

      subjects.forEach((item) => {
        const foundImage = imageUrlConstant?.find(
          (url) => url?.name?.toLowerCase() === item?.subject?.toLowerCase(),
        );
        item.coverImage = foundImage ? foundImage?.image : null;
      });

      return subjects;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Get Open Ended questions count
  async getOpenEndedQuesCount(): Promise<OpenEndedQuesCount[]> {
    try {
      const result = await this.questionModel.aggregate([
        {
          $match: {
            mode: {
              $in: [
                'DX QUEST',
                'MED MATCH',
                'PROBLEM LIST EVALUATION',
                'BROAD SCOPE QUIZ',
              ],
            },
            reviewed: true,
          },
        },
        {
          $group: {
            _id: '$mode',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            count: 1,
          },
        },
      ]); // Using index

      result.forEach((res) => {
        switch (res?.category?.toLowerCase()) {
          case 'dx quest':
            res.coverImage =
              'https://d1p9fc0i566fiv.cloudfront.net/logo-images/dx-quest.png';
            break;

          case 'med match':
            res.coverImage =
              'https://d1p9fc0i566fiv.cloudfront.net/logo-images/med-match.png';
            break;

          case 'problem list evaluation':
            res.coverImage =
              'https://d1p9fc0i566fiv.cloudfront.net/logo-images/pathology.png';
            break;

          case 'broad scope quiz':
            res.coverImage =
              'https://d1p9fc0i566fiv.cloudfront.net/logo-images/biochemistry.png';
            break;
        }
      });

      return result;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Function to return all topics and their subtopics filtered by subcategoryId
  async getTopics(
    subcategoryId?: string,
    subspecialty?: string,
    subject?: string,
  ): Promise<GetSystemsRes[]> {
    try {
      const matchQuery: Record<string, any> = {};
      if (subcategoryId) {
        matchQuery['subcategory.id'] = subcategoryId;
      }
      if (subspecialty) {
        matchQuery['subspecialty'] = subspecialty;
      }
      if (subject) {
        matchQuery['subject'] = subject;
      }

      // Step 1: Fetch distinct systems, topics, and subtopics, filtered by subcategoryId if provided
      const topicsWithSubtopics = await this.questionModel.aggregate([
        {
          $match: matchQuery,
        },
        {
          $group: {
            _id: {
              system: '$system',
              topic: '$topic',
            },
            subtopics: { $addToSet: '$subtopic' },
          },
        },
        {
          $group: {
            _id: '$_id.system',
            topics: {
              $push: {
                topic: '$_id.topic',
                subtopics: {
                  $filter: {
                    input: '$subtopics',
                    as: 'subtopic',
                    cond: { $ne: ['$$subtopic', null] },
                  },
                },
              },
            },
          },
        },
        {
          $match: {
            _id: { $ne: null }, // Only include entries where 'system' is not null
          },
        },
        {
          $project: {
            system: '$_id',
            topics: 1,
            _id: 0,
          },
        },
      ]);

      // Ensure subtopics is always an array
      const formattedTopics = topicsWithSubtopics.map((systemGroup) => ({
        system: systemGroup.system,
        topics: systemGroup.topics.map((topic) => ({
          topic: topic.topic,
          subtopics: topic.subtopics || [],
        })),
      }));

      return formattedTopics;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get random questions from the database to play medscroll trivia quiz
  async getQuestions({
    userUUID,
    subcatId,
    quizUUID,
    caseUUID,
    systems,
    isContinue,
    subspecialty,
  }: GetQuestionsParam): Promise<any> {
    try {
      if (!subcatId && !quizUUID && !caseUUID && !systems?.length) {
        throw new BadRequestException(
          'Either subcatId, quizUUID, caseUUID, or systems must be provided.',
        );
      }

      const query: any = {
        presentedTo: { $ne: userUUID },
        ...(quizUUID ? { quizUUID } : {}),
        ...(subcatId ? { 'subcategory.id': subcatId } : {}),
        ...(caseUUID ? { caseUUID } : {}),
        ...(subspecialty ? { subspecialty } : {}),
        // hasOptions: true,
      };

      const totalQuestions = 10; // Total number of questions to fetch
      const finalResult = [];
      const addedQuestionIds = new Set();

      if (!caseUUID) query.reviewed = true;

      if (systems?.length > 0 && systems !== null && systems !== undefined) {
        // Calculate total topics across all systems with topics
        const totalTopics = systems.reduce(
          (sum, { data }) => sum + (data?.length || 1),
          0,
        );
        const questionsPerTopic = Math.floor(totalQuestions / totalTopics);
        let remainingQuestions =
          totalQuestions - questionsPerTopic * totalTopics;

        for (const { system, data } of systems) {
          if (data && data.length > 0) {
            for (const { topic, subtopics } of data) {
              const topicQuery = { ...query, system, topic };
              if (subtopics && subtopics.length > 0) {
                topicQuery.subtopic = { $in: subtopics };
              }

              const questionsToFetch =
                questionsPerTopic + (remainingQuestions > 0 ? 1 : 0);
              if (remainingQuestions > 0) remainingQuestions--;

              let questions = await this.questionModel.aggregate([
                { $match: topicQuery },
                { $sample: { size: questionsToFetch } },
                { $project: { presentedTo: 0 } },
              ]);

              if (questions.length < questionsToFetch && !caseUUID) {
                await this.questionModel.updateMany(
                  { quizUUID }, // Make sure the filter here matches your requirements
                  { $pull: { presentedTo: userUUID } },
                );
                questions = await this.questionModel.aggregate([
                  { $match: topicQuery },
                  { $sample: { size: questionsToFetch } },
                  { $project: { presentedTo: 0 } },
                ]);
              }

              if (caseUUID) delete query.presentedTo;

              if (!caseUUID) {
                const questionIds = questions.map((question) => question._id);
                await this.questionModel.updateMany(
                  { _id: { $in: questionIds } },
                  { $push: { presentedTo: userUUID } },
                );
              }

              for (const question of questions) {
                if (!addedQuestionIds.has(question._id.toString())) {
                  question.options = shuffle(question.options);
                  question.questionNumber = finalResult.length + 1;
                  finalResult.push(question);
                  addedQuestionIds.add(question._id.toString());
                }
              }

              if (finalResult.length >= totalQuestions) break;
            }
          } else {
            const systemQuery = { ...query, system };
            const systemQuestionsToFetch =
              questionsPerTopic + (remainingQuestions > 0 ? 1 : 0);
            if (remainingQuestions > 0) remainingQuestions--;

            let questions = await this.questionModel.aggregate([
              { $match: systemQuery },
              { $sample: { size: systemQuestionsToFetch } },
              { $project: { presentedTo: 0 } },
            ]);

            if (questions.length < systemQuestionsToFetch && !caseUUID) {
              await this.questionModel.updateMany(
                { quizUUID },
                { $pull: { presentedTo: userUUID } },
              );
              questions = await this.questionModel.aggregate([
                { $match: systemQuery },
                { $sample: { size: systemQuestionsToFetch } },
                { $project: { presentedTo: 0 } },
              ]);
            }

            if (caseUUID) delete query.presentedTo;

            if (!caseUUID) {
              const questionIds = questions.map((question) => question._id);
              await this.questionModel.updateMany(
                { _id: { $in: questionIds } },
                { $push: { presentedTo: userUUID } },
              );
            }

            for (const question of questions) {
              if (!addedQuestionIds.has(question._id.toString())) {
                question.options = shuffle(question.options);
                question.questionNumber = finalResult.length + 1;
                finalResult.push(question);
                addedQuestionIds.add(question._id.toString());
              }
            }

            if (finalResult.length >= totalQuestions) break;
          }
        }

        if (finalResult.length < totalQuestions) {
          for (const { system, data } of systems) {
            if (finalResult.length >= totalQuestions) break;

            if (data && data.length > 0) {
              for (const { topic, subtopics } of data) {
                const topicQuery = { ...query, system, topic };
                if (subtopics && subtopics.length > 0) {
                  topicQuery.subtopic = { $in: subtopics };
                }

                const additionalQuestions = await this.questionModel.aggregate([
                  { $match: topicQuery },
                  { $sample: { size: totalQuestions - finalResult.length } },
                  { $project: { presentedTo: 0 } },
                ]);

                additionalQuestions.forEach((question) => {
                  if (!addedQuestionIds.has(question._id.toString())) {
                    question.options = shuffle(question.options);
                    question.questionNumber = finalResult.length + 1;
                    finalResult.push(question);
                    addedQuestionIds.add(question._id.toString());
                  }
                });

                if (finalResult.length >= totalQuestions) break;
              }
            } else {
              const systemQuery = { ...query, system };
              const additionalQuestions = await this.questionModel.aggregate([
                { $match: systemQuery },
                { $sample: { size: totalQuestions - finalResult.length } },
                { $project: { presentedTo: 0 } },
              ]);

              additionalQuestions.forEach((question) => {
                if (!addedQuestionIds.has(question._id.toString())) {
                  question.options = shuffle(question.options);
                  question.questionNumber = finalResult.length + 1;
                  finalResult.push(question);
                  addedQuestionIds.add(question._id.toString());
                }
              });
            }
          }
        }

        finalResult.sort((a, b) => a?.system?.localeCompare(b?.system));

        return finalResult.slice(0, totalQuestions);
      } else {
        if (caseUUID) delete query.presentedTo;
        let questions = await this.questionModel.aggregate([
          { $match: query },
          { $sample: { size: 10 } },
          { $project: { presentedTo: 0 } },
        ]);

        if (questions.length !== 10 && !caseUUID) {
          await this.questionModel.updateMany(
            { quizUUID }, // Ensure quizUUID is present if needed
            { $pull: { presentedTo: userUUID } },
          );
          questions = await this.questionModel.aggregate([
            { $match: query },
            { $sample: { size: 10 } },
            { $project: { presentedTo: 0 } },
          ]);
        }

        if (!caseUUID) {
          const questionIds = questions.map((question) => question._id);
          await this.questionModel.updateMany(
            { _id: { $in: questionIds } },
            { $push: { presentedTo: userUUID } },
          );
        }

        questions.forEach((question, index) => {
          question.options = shuffle(question.options);
          question.questionNumber = index + 1;
        });

        return questions;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get random questions from the database
  async getGameQues(
    userUUID: string,
    quizUUID: string,
  ): Promise<QuestionDocument[]> {
    try {
      // Fetch a random incomplete question
      let questions = await this.questionModel.aggregate([
        {
          $match: {
            quizUUID,
            presentedTo: { $ne: userUUID }, // Not presented to the user
          },
        },
        { $sample: { size: 10 } }, // Randomly pick one
        { $project: { presentedTo: 0 } }, // Exclude the responses and presentedTo fields
      ]);

      // If no available question, clear userUUID from all questions and fetch agaian
      if (questions.length !== 10) {
        await this.questionModel.updateMany(
          { quizUUID },
          { $pull: { presentedTo: userUUID } },
        );

        questions = await this.questionModel.aggregate([
          {
            $match: {
              quizUUID,
            },
          },
          { $sample: { size: 10 } },
          { $project: { presentedTo: 0 } },
        ]);
      }

      // Update the questions to mark them as presented to the user
      const questionIds = questions.map((question) => question._id); // Get question IDs
      await this.questionModel.updateMany(
        { _id: { $in: questionIds } },
        { $push: { presentedTo: userUUID } },
      );

      // Shuffle options array
      questions.forEach((question, index) => {
        question.options = shuffle(question.options);
        question.questionNumber = index + 1;
      });

      // const stringQuestion = JSON.stringify(questions);
      // const encryptQuestion = this.cryptoService.encryptAnswer(stringQuestion);

      return questions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Method for getting the count for topics or system on a selected subcategory
  async getQuestionCount(
    systems: SystemTopics[],
    query: any,
  ): Promise<{ systemIsLess: boolean; topicAndSubtopicIsLess: boolean }> {
    let totalQuestionsCount = 0;
    let totalTopicCount = 0;
    let topicAndSubtopicIsLess = false;
    let systemIsLess = false;
    let topicsAndSubtopics: any;

    // Step 1: Count questions by topic and subtopic for each system
    for (const { system, data } of systems) {
      topicsAndSubtopics = data;
      for (const { topic, subtopics } of data) {
        const topicQuery: any = { ...query, system, topic };

        if (subtopics && subtopics.length > 0) {
          topicQuery.subtopic = { $in: subtopics };
        }

        const topicCount = await this.questionModel.countDocuments(topicQuery);
        totalQuestionsCount += topicCount;
        totalTopicCount += topicCount;
      }
    }

    // Step 2: If total count is less than 5, count by system level
    if (totalQuestionsCount < 5) {
      for (const { system } of systems) {
        const systemQuery: any = { ...query, system };
        const systemCount = await this.questionModel.countDocuments(
          systemQuery,
        );
        totalQuestionsCount += systemCount;
      }
    }

    if (systems?.length === 1 && totalQuestionsCount < 5) {
      topicAndSubtopicIsLess = true;
      systemIsLess = true;
    } else if (systems?.length > 1 && totalQuestionsCount < 5) {
      systemIsLess = true;
    }

    return {
      systemIsLess,
      topicAndSubtopicIsLess,
    };
  }

  // async getQuestions({
  //   userUUID,
  //   subcatId,
  //   quizUUID,
  //   caseUUID,
  //   systems,
  //   isContinue,
  // }: GetQuestionsParam): Promise<any> {
  //   try {
  //     if (!subcatId && !quizUUID && !caseUUID && !systems?.length) {
  //       throw new BadRequestException(
  //         'Either subcatId, quizUUID, caseUUID, or systems must be provided.',
  //       );
  //     }

  //     const query: any = {
  //       presentedTo: { $ne: userUUID },
  //       ...(quizUUID ? { quizUUID } : {}),
  //       ...(subcatId ? { 'subcategory.id': subcatId } : {}),
  //       ...(caseUUID ? { caseUUID } : {}),
  //     };

  //     const totalQuestions = 10; // Total number of questions to fetch
  //     const finalResult = [];
  //     const addedQuestionIds = new Set();

  //     if (systems?.length > 0) {
  //       for (const { system, data } of systems) {
  //         let topicQuestionsFound = 0;
  //         let systemQuestionsFound = 0;

  //         // Step 1: Count questions by topic and subtopic
  //         for (const { topic, subtopics } of data) {
  //           const topicQuery = { ...query, system, topic };
  //           if (subtopics && subtopics.length > 0) {
  //             topicQuery.subtopic = { $in: subtopics };
  //           }

  //           topicQuestionsFound += await this.questionModel.countDocuments(topicQuery);
  //         }

  //         // Step 2: If total by topic is less than 5, count by system level
  //         if (topicQuestionsFound < 5) {
  //           const systemQuery = { ...query, system };
  //           systemQuestionsFound = await this.questionModel.countDocuments(systemQuery);
  //         }

  //         console.log("system:: ", systemQuestionsFound )

  //         const totalQuestionsFound = topicQuestionsFound + systemQuestionsFound;

  //         // Log total questions found
  //         console.log(`Total questions found for system ${system}: ${totalQuestionsFound}`);

  //         // Fetch questions by topic and subtopic first
  //         for (const { topic, subtopics } of data) {
  //           const topicQuery = { ...query, system, topic };
  //           if (subtopics && subtopics.length > 0) {
  //             topicQuery.subtopic = { $in: subtopics };
  //           }

  //           const questionsToFetch = Math.min(
  //             topicQuestionsFound,
  //             totalQuestions - finalResult.length
  //           );

  //           let questions = await this.questionModel.aggregate([
  //             { $match: topicQuery },
  //             { $sample: { size: questionsToFetch } },
  //             { $project: { presentedTo: 0 } },
  //           ]);

  //           for (const question of questions) {
  //             if (!addedQuestionIds.has(question._id.toString())) {
  //               question.options = shuffle(question.options);
  //               question.questionNumber = finalResult.length + 1;
  //               finalResult.push(question);
  //               addedQuestionIds.add(question._id.toString());
  //             }
  //           }

  //           if (finalResult.length >= totalQuestions) break;
  //         }

  //         // If there are not enough questions, fetch the remaining from the system level
  //         if (finalResult.length < totalQuestions) {
  //           const systemQuery = { ...query, system };
  //           const remainingQuestions = totalQuestions - finalResult.length;

  //           let additionalQuestions = await this.questionModel.aggregate([
  //             { $match: systemQuery },
  //             { $sample: { size: remainingQuestions } },
  //             { $project: { presentedTo: 0 } },
  //           ]);

  //           for (const question of additionalQuestions) {
  //             if (!addedQuestionIds.has(question._id.toString())) {
  //               question.options = shuffle(question.options);
  //               question.questionNumber = finalResult.length + 1;
  //               finalResult.push(question);
  //               addedQuestionIds.add(question._id.toString());
  //             }
  //           }
  //         }

  //         if (finalResult.length >= totalQuestions) break;
  //       }

  //       return finalResult.slice(0, totalQuestions);
  //     } else {
  //       if (caseUUID) delete query.presentedTo;

  //       let questions = await this.questionModel.aggregate([
  //         { $match: query },
  //         { $sample: { size: 10 } },
  //         { $project: { presentedTo: 0 } },
  //       ]);

  //       if (questions.length !== 10 && !caseUUID) {
  //         await this.questionModel.updateMany(
  //           { quizUUID },
  //           { $pull: { presentedTo: userUUID } }
  //         );
  //         questions = await this.questionModel.aggregate([
  //           { $match: query },
  //           { $sample: { size: 10 } },
  //           { $project: { presentedTo: 0 } },
  //         ]);
  //       }

  //       if (!caseUUID) {
  //         const questionIds = questions.map((question) => question._id);
  //         await this.questionModel.updateMany(
  //           { _id: { $in: questionIds } },
  //           { $push: { presentedTo: userUUID } }
  //         );
  //       }

  //       questions.forEach((question, index) => {
  //         question.options = shuffle(question.options);
  //         question.questionNumber = index + 1;
  //       });

  //       return questions;
  //     }
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async getQuestions_v2({
    userUUID,
    subcatId,
    quizUUID,
    caseUUID,
    systems,
    isContinue,
  }: GetQuestionsParam): Promise<GetQuestionsRes_v2> {
    try {
      if (!subcatId && !quizUUID && !caseUUID && !systems?.length) {
        throw new BadRequestException(
          'Either subcatId, quizUUID, caseUUID, or systems must be provided.',
        );
      }

      const query: any = {
        presentedTo: { $ne: userUUID },
        ...(quizUUID ? { quizUUID } : {}),
        ...(subcatId ? { 'subcategory.id': subcatId } : {}),
        ...(caseUUID ? { caseUUID } : {}),
      };
      let systemIsLess = false;
      let topicAndSubtopicIsLess = false;

      if (systems) {
        const { systemIsLess: systemLess, topicAndSubtopicIsLess: topicLess } =
          await this.getQuestionCount(systems, query); //for holding current total questions
        systemIsLess = systemLess;
        topicAndSubtopicIsLess = topicLess;
      }

      const totalQuestions = 10; // Total number of questions to fetch
      const finalResult = [];
      let resultBySystem: any = [];
      let resultBySubCat: any = [];
      const addedQuestionIds = new Set();

      if (systemIsLess) {
        const payload = {
          userUUID,
          quizUUID,
          caseUUID,
          query,
        };
        resultBySubCat = await this.getRandomQuesBySubCat(payload);
      }
      if (topicAndSubtopicIsLess) {
        const payload = {
          userUUID,
          subcatId,
          quizUUID,
          caseUUID,
          systems,
          isContinue,
          query,
        };
        resultBySystem = await this.getRandomSystemQuestions(payload);
      }

      if (systems?.length > 0 && systems !== null && systems !== undefined) {
        // Calculate total topics across all systems with topics
        const totalTopics = systems.reduce(
          (sum, { data }) => sum + (data?.length || 1),
          0,
        );
        const questionsPerTopic = Math.floor(totalQuestions / totalTopics);
        let remainingQuestions =
          totalQuestions - questionsPerTopic * totalTopics;

        for (const { system, data } of systems) {
          if (data && data.length > 0) {
            for (const { topic, subtopics } of data) {
              const topicQuery = { ...query, system, topic };
              if (subtopics && subtopics.length > 0) {
                topicQuery.subtopic = { $in: subtopics };
              }

              const questionsToFetch =
                questionsPerTopic + (remainingQuestions > 0 ? 1 : 0);
              if (remainingQuestions > 0) remainingQuestions--;

              let questions = await this.questionModel.aggregate([
                { $match: topicQuery },
                { $sample: { size: questionsToFetch } },
                { $project: { presentedTo: 0 } },
              ]);

              if (questions.length < questionsToFetch && !caseUUID) {
                await this.questionModel.updateMany(
                  { quizUUID }, // Make sure the filter here matches your requirements
                  { $pull: { presentedTo: userUUID } },
                );
                questions = await this.questionModel.aggregate([
                  { $match: topicQuery },
                  { $sample: { size: questionsToFetch } },
                  { $project: { presentedTo: 0 } },
                ]);
              }

              if (caseUUID) delete query.presentedTo;

              if (!caseUUID) {
                const questionIds = questions.map((question) => question._id);
                await this.questionModel.updateMany(
                  { _id: { $in: questionIds } },
                  { $push: { presentedTo: userUUID } },
                );
              }

              for (const question of questions) {
                if (!addedQuestionIds.has(question._id.toString())) {
                  question.options = shuffle(question.options);
                  question.questionNumber = finalResult.length + 1;
                  finalResult.push(question);
                  addedQuestionIds.add(question._id.toString());
                }
              }

              if (finalResult.length >= totalQuestions) break;
            }
          } else {
            const systemQuery = { ...query, system };
            const systemQuestionsToFetch =
              questionsPerTopic + (remainingQuestions > 0 ? 1 : 0);
            if (remainingQuestions > 0) remainingQuestions--;

            let questions = await this.questionModel.aggregate([
              { $match: systemQuery },
              { $sample: { size: systemQuestionsToFetch } },
              { $project: { presentedTo: 0 } },
            ]);

            if (questions.length < systemQuestionsToFetch && !caseUUID) {
              await this.questionModel.updateMany(
                { quizUUID },
                { $pull: { presentedTo: userUUID } },
              );
              questions = await this.questionModel.aggregate([
                { $match: systemQuery },
                { $sample: { size: systemQuestionsToFetch } },
                { $project: { presentedTo: 0 } },
              ]);
            }

            if (caseUUID) delete query.presentedTo;

            if (!caseUUID) {
              const questionIds = questions.map((question) => question._id);
              await this.questionModel.updateMany(
                { _id: { $in: questionIds } },
                { $push: { presentedTo: userUUID } },
              );
            }

            for (const question of questions) {
              if (!addedQuestionIds.has(question._id.toString())) {
                question.options = shuffle(question.options);
                question.questionNumber = finalResult.length + 1;
                finalResult.push(question);
                addedQuestionIds.add(question._id.toString());
              }
            }

            if (finalResult.length >= totalQuestions) break;
          }
        }

        if (finalResult.length < totalQuestions) {
          for (const { system, data } of systems) {
            if (finalResult.length >= totalQuestions) break;

            if (data && data.length > 0) {
              for (const { topic, subtopics } of data) {
                const topicQuery = { ...query, system, topic };
                if (subtopics && subtopics.length > 0) {
                  topicQuery.subtopic = { $in: subtopics };
                }

                const additionalQuestions = await this.questionModel.aggregate([
                  { $match: topicQuery },
                  { $sample: { size: totalQuestions - finalResult.length } },
                  { $project: { presentedTo: 0 } },
                ]);

                additionalQuestions.forEach((question) => {
                  if (!addedQuestionIds.has(question._id.toString())) {
                    question.options = shuffle(question.options);
                    question.questionNumber = finalResult.length + 1;
                    finalResult.push(question);
                    addedQuestionIds.add(question._id.toString());
                  }
                });

                if (finalResult.length >= totalQuestions) break;
              }
            } else {
              const systemQuery = { ...query, system };
              const additionalQuestions = await this.questionModel.aggregate([
                { $match: systemQuery },
                { $sample: { size: totalQuestions - finalResult.length } },
                { $project: { presentedTo: 0 } },
              ]);

              additionalQuestions.forEach((question) => {
                if (!addedQuestionIds.has(question._id.toString())) {
                  question.options = shuffle(question.options);
                  question.questionNumber = finalResult.length + 1;
                  finalResult.push(question);
                  addedQuestionIds.add(question._id.toString());
                }
              });
            }
          }
        }

        return {
          resultBySubCat, //this is for getting question randomly from subcategory when inputted systems have lesser questions
          resultBySystem, //this is for getting question randomly from selected systems when specified topics or subtopics have lesser data.
          resultByTopic: finalResult.slice(0, totalQuestions), //This is for getting result by specified system topic and subtopics
          isLessBySystems: systemIsLess, //flag that questions under that system is less
          isLessBySystemsTopic: topicAndSubtopicIsLess, //flag that questions under that system topic or subtopics is less
        };
      } else {
        if (caseUUID) delete query.presentedTo;
        let questions = await this.questionModel.aggregate([
          { $match: query },
          { $sample: { size: 10 } },
          { $project: { presentedTo: 0 } },
        ]);

        if (questions.length !== 10 && !caseUUID) {
          await this.questionModel.updateMany(
            { quizUUID }, // Ensure quizUUID is present if needed
            { $pull: { presentedTo: userUUID } },
          );
          questions = await this.questionModel.aggregate([
            { $match: query },
            { $sample: { size: 10 } },
            { $project: { presentedTo: 0 } },
          ]);
        }

        if (!caseUUID) {
          const questionIds = questions.map((question) => question._id);
          await this.questionModel.updateMany(
            { _id: { $in: questionIds } },
            { $push: { presentedTo: userUUID } },
          );
        }

        questions.forEach((question, index) => {
          question.options = shuffle(question.options);
          question.questionNumber = index + 1;
        });

        return {
          resultBySubCat, //this is for getting question randomly from subcategory when inputted systems have lesser questions
          resultBySystem, //this is for getting question randomly from selected systems when specified topics or subtopics have lesser data.
          resultByTopic: questions, //This is for getting result by specified system topic and subtopics
          isLessBySystems: systemIsLess, //flag that questions under that system is less
          isLessBySystemsTopic: topicAndSubtopicIsLess, //flag that questions under that system topic or subtopics is less
        };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getRandomQuesBySubCat({
    userUUID,
    quizUUID,
    caseUUID,
    query,
  }: GetQuestionsParam & { query: any }): Promise<any> {
    try {
      if (caseUUID) delete query.presentedTo;

      let questions = await this.questionModel.aggregate([
        { $match: query },
        { $sample: { size: 10 } },
        { $project: { presentedTo: 0 } },
      ]);

      if (questions.length !== 10 && !caseUUID) {
        await this.questionModel.updateMany(
          { quizUUID }, // Ensure quizUUID is present if needed
          { $pull: { presentedTo: userUUID } },
        );
        questions = await this.questionModel.aggregate([
          { $match: query },
          { $sample: { size: 10 } },
          { $project: { presentedTo: 0 } },
        ]);
      }

      if (!caseUUID) {
        const questionIds = questions.map((question) => question._id);
        await this.questionModel.updateMany(
          { _id: { $in: questionIds } },
          { $push: { presentedTo: userUUID } },
        );
      }

      questions.forEach((question, index) => {
        question.options = shuffle(question.options);
        question.questionNumber = index + 1;
      });

      return questions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getRandomSystemQuestions({
    userUUID,
    quizUUID,
    caseUUID,
    systems,
    query,
  }: GetQuestionsParam & { query: any }): Promise<any> {
    try {
      const totalQuestions = 10; // Total number of questions to fetch
      const finalResult = [];
      const addedQuestionIds = new Set();

      if (systems?.length > 0 && systems !== null && systems !== undefined) {
        // Calculate total topics across all systems with topics
        const totalTopics = systems.reduce(
          (sum, { data }) => sum + (data?.length || 1),
          0,
        );
        const questionsPerSystem = Math.floor(totalQuestions / totalTopics);
        let remainingQuestions =
          totalQuestions - questionsPerSystem * totalTopics;

        for (const { system, data } of systems) {
          const systemQuery = { ...query, system };
          const systemQuestionsToFetch =
            questionsPerSystem + (remainingQuestions > 0 ? 1 : 0);
          if (remainingQuestions > 0) remainingQuestions--;

          let questions = await this.questionModel.aggregate([
            { $match: systemQuery },
            { $sample: { size: systemQuestionsToFetch } },
            { $project: { presentedTo: 0 } },
          ]);

          if (questions.length < systemQuestionsToFetch && !caseUUID) {
            await this.questionModel.updateMany(
              { quizUUID },
              { $pull: { presentedTo: userUUID } },
            );
            questions = await this.questionModel.aggregate([
              { $match: systemQuery },
              { $sample: { size: systemQuestionsToFetch } },
              { $project: { presentedTo: 0 } },
            ]);
          }

          if (caseUUID) delete query.presentedTo;

          if (!caseUUID) {
            const questionIds = questions.map((question) => question._id);
            await this.questionModel.updateMany(
              { _id: { $in: questionIds } },
              { $push: { presentedTo: userUUID } },
            );
          }

          for (const question of questions) {
            if (!addedQuestionIds.has(question._id.toString())) {
              question.options = shuffle(question.options);
              question.questionNumber = finalResult.length + 1;
              finalResult.push(question);
              addedQuestionIds.add(question._id.toString());
            }
          }

          if (finalResult.length >= totalQuestions) break;
        }
        if (finalResult.length < totalQuestions) {
          for (const { system, data } of systems) {
            if (finalResult.length >= totalQuestions) break;
            const systemQuery = { ...query, system };
            const additionalQuestions = await this.questionModel.aggregate([
              { $match: systemQuery },
              { $sample: { size: totalQuestions - finalResult.length } },
              { $project: { presentedTo: 0 } },
            ]);

            additionalQuestions.forEach((question) => {
              if (!addedQuestionIds.has(question._id.toString())) {
                question.options = shuffle(question.options);
                question.questionNumber = finalResult.length + 1;
                finalResult.push(question);
                addedQuestionIds.add(question._id.toString());
              }
            });
          }
        }

        return finalResult.slice(0, totalQuestions);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getQuesFromQuesBank(
    userUUID: string,
    quizUUID: string,
  ): Promise<QuestionDocument[]> {
    try {
      let questions = await this.questionModel.aggregate([
        {
          $match: {
            quizUUID,
            presentedTo: { $ne: userUUID }, // Not presented to the user
          },
        },
        { $sample: { size: 10 } }, // Randomly pick 10
        { $project: { presentedTo: 0 } }, // Exclude the responses and presentedTo fields
      ]); // Using index

      // If no available question, clear userUUID from all questions and fetch agaian
      if (!questions.length) {
        await this.questionModel.updateMany(
          { quizUUID },
          { $pull: { presentedTo: userUUID } },
        );

        questions = await this.questionModel.aggregate([
          {
            $match: {
              quizUUID,
            },
          },
          { $sample: { size: 10 } },
          { $project: { presentedTo: 0 } },
        ]); // Using index
      }

      // Update the questions to mark them as presented to the user
      const questionIds = questions.map((question) => question._id); // Get question IDs
      await this.questionModel.updateMany(
        { _id: { $in: questionIds } },
        { $push: { presentedTo: userUUID } },
      );

      // Shuffle options array
      questions.forEach((question, index) => {
        question.options = shuffle(question.options);
        question.questionNumber = index + 1;
      });

      // const stringQuestion = JSON.stringify(questions);
      // const encryptQuestion = this.cryptoService.encryptAnswer(stringQuestion);

      return questions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get random Open ended questions from my question bank to play QB quiz
  async getOpenEndedQuesFromQuesBank(
    userUUID: string,
    questionType: string,
  ): Promise<GenerateOpenEndedQuesRes[]> {
    try {
      // Fetch questions that have not been presented to the user
      let questions = await this.questionModel.aggregate([
        {
          $match: {
            mode: questionType?.toUpperCase(),
            reviewed: true,
            presentedTo: { $ne: userUUID },
          },
        },
        { $sample: { size: 10 } },
        { $project: { presentedTo: 0 } },
      ]); // Using index

      // Check if fewer than 10 questions are available
      if (questions.length < 10) {
        const remainingCount = 10 - questions.length;

        // Fetch all remaining questions that were already presented to the user
        const presentedQuestions = await this.questionModel.aggregate([
          {
            $match: {
              mode: questionType?.toUpperCase(),
              reviewed: true,
              presentedTo: userUUID,
            },
          },
          { $sample: { size: remainingCount } }, // Pick enough to make the total 10
          { $project: { presentedTo: 0 } },
        ]); // Using index

        // Combine new questions and previously presented questions
        questions = [...questions, ...presentedQuestions];

        if (questions.length < 10) {
          await this.questionModel.updateMany(
            { mode: questionType?.toUpperCase() },
            { $pull: { presentedTo: userUUID } },
          );

          // Fetch 10 random questions after clearing the presented questions
          questions = await this.questionModel.aggregate([
            {
              $match: {
                mode: questionType?.toUpperCase(),
                reviewed: true,
              },
            },
            { $sample: { size: 10 } },
            { $project: { presentedTo: 0 } },
          ]); // Using index
        }
      }

      // Update the questions to mark them as presented to the user
      const questionIds = questions.map((question) => question._id);
      await this.questionModel.updateMany(
        { _id: { $in: questionIds } },
        { $push: { presentedTo: userUUID } },
      );

      // Shuffle options array
      questions.forEach((question, index) => {
        question.options = shuffle(question?.options);
        question.questionNumber = index + 1;
      });

      const formatResult = await Promise.all(
        questions.map(async (item) => {
          const getQuizDuration = await this.quizService.getQuiz(item.quizUUID);
          // Split the answer into an array using regex to match the numbering
          const transformedAnswer = item?.answer?.answer
            ?.split(/(?:\d+\.\s*)/)
            .filter(Boolean);
          item.answer.answer = transformedAnswer;

          return {
            ...item,
            point: getQuizDuration?.point,
            duration: convertTimeToSeconds(getQuizDuration?.duration),
            timer: getQuizDuration?.timer,
          };
        }),
      );

      return formatResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //get unreviewed opene ended questions
  async getOpenEndedQuesToReview(
    payload: GetQuesToReviewInput,
  ): Promise<ReviewOpenEndedQuesRes> {
    try {
      const {
        medScrollID,
        limit = 10,
        page = 1,
        questionType,
        subspecialty,
      } = payload;
      const foundID = this.configService.get<string>('MEDSCROLL_ID');

      // Ensure valid limit and page numbers
      const pageSize = Math.max(limit, 1); // Ensure limit is at least 1
      const currentPage = Math.max(page, 1); // Ensure page is at least 1

      const count = await this.questionModel.countDocuments({
        mode: questionType?.toUpperCase(),
        subspecialty,
      });
      const totalPages = Math.ceil(count / pageSize); // Always round up to ensure total pages covers all records

      if (medScrollID === foundID) {
        const foundQuestions = await this.questionModel
          .aggregate([
            {
              $match: {
                mode: questionType?.toUpperCase(),
                reviewed: false,
                subspecialty,
              },
            },
            {
              $project: {
                question: 1,
                questionUUID: 1,
                subspecialty: 1,
                specialty: 1,
                reference: 1,
                topic: 1,
                subtopic: 1,
                reviewed: 1,
                comments: 1,
                answer: '$answer.answer',
                answer_details: '$answer.answer_details',
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
      } else {
        throw new UnauthorizedException(
          'You are not authorized to view this resource.',
        );
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Get all my questions or get my questions with quizUUID or quizCategory
  async getMyQuestions(
    userId: ObjectId,
    quizOrCatId?: string, // quizUUID or quizCategoryId
    page?: number,
    limit?: number,
  ): Promise<GetMyQuesRes> {
    try {
      const query = { userId };

      if (quizOrCatId) {
        query['$or'] = [
          { quizUUID: quizOrCatId },
          { quizCategoryId: quizOrCatId },
        ];
      }

      const questions = await this.questionModel
        .find(query)
        .sort({ _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(); // Using index

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.questionModel,
        query,
        questions,
        limit,
        page,
      );

      return { questions, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get questions to update
  async getQuesToUpdate(
    userId: ObjectId,
    quizUUID: string,
  ): Promise<QuestionDocument[]> {
    try {
      const questions = await this.questionModel.aggregate([
        {
          $match: {
            quizUUID,
            userId,
          },
        },
      ]); // Using index

      return questions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get one question
  async getOneQuestion(
    userId: ObjectId,
    questionUUID: string,
  ): Promise<QuestionDocument> {
    try {
      const question = await this.questionModel
        .findOne({
          questionUUID,
          userId,
        })
        .exec();

      if (!question) throw new NotFoundException('Question not found');

      return question;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete question from quiz
  async deleteQuestion(
    userId: ObjectId,
    questionUUID: string,
  ): Promise<{ message: string }> {
    try {
      const question = await this.getOneQuestion(userId, questionUUID);

      // Get the quiz where the question is created
      const quiz = await this.quizService.getQuiz(question?.quizUUID);

      // Delete image/images if exist
      if (question?.images?.length)
        await this.awsS3Service.deleteFiles(question.images);

      await question.deleteOne();

      // Substract 1 from the quiz totalQuestion filed
      quiz.totalQuestion -= 1;
      await quiz.save();

      return {
        message: 'Question deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  // Submit response for questions
  async submitResponse(
    user: UserDocument,
    submitResInput: SubmitResInput,
  ): Promise<SubmitQRes> {
    try {
      const {
        responses,
        point,
        isQbank,
        isIstantQuiz,
        isUntimeQuiz,
        component,
        region,
      } = submitResInput;

      if (!isIstantQuiz) this.validateResponse(responses);

      let totalPoints = 0;
      let totalTimeTaken = 0;
      let totalCorrect = 0;
      let totalMissed = 0;
      let totalSpeedBonus = 0;

      responses.forEach(({ isCorrect, isMissed, timeTaken }) => {
        if (isCorrect && isMissed)
          throw new BadRequestException('A correct answer cannot be missed');

        if (isCorrect) {
          const speedBonus = timeTaken <= 8 ? 2 : 0;
          totalPoints += isQbank ? point + speedBonus : 1 + speedBonus;
          totalCorrect++;
          totalSpeedBonus += speedBonus;
        }

        if (isMissed) totalMissed++;

        totalTimeTaken += timeTaken || 0;
      });

      if (isQbank) {
        user.quizzer.performance.correctQB += totalCorrect;
        user.quizzer.performance.incorrectQB +=
          responses.length - totalCorrect - totalMissed;
        user.quizzer.performance.missedQB += totalMissed;
        user.quizzer.totalQBques += responses.length;
      }

      if (!isQbank && !isUntimeQuiz) {
        user.quizzer.totalPoints += totalPoints;
        user.quizzer.totalTimeTaken = +totalTimeTaken.toFixed(3);
        user.quizzer.performance.correct += totalCorrect;
        user.quizzer.performance.incorrect +=
          responses.length - totalCorrect - totalMissed;
        user.quizzer.performance.missed += totalMissed;
        user.quizzer.totalTriQues += responses.length;
      }

      user.quizzer.totalQA += responses.length;
      await this.userService.updateUser(user, true); // Update daily & weekly streaks & save user

      // PROD
      if (component) {
        this.eventEmitter.emit(LeaderBoardEventsType.ADD_SCORE, {
          user,
          region,
          component: component.toUpperCase(),
          points: totalPoints,
          timeTaken: totalTimeTaken,
        });
      }

      await this.cacheService.clearCacheByPattern(`${CACHE_KEY.LEADERBOARD}:*`);

      return {
        totalPoints,
        totalCorrect,
        totalIncorrect: responses.length - totalCorrect - totalMissed,
        totalMissed,
        totalSpeedBonus,
        totalScore: user?.quizzer?.totalPoints,
        userRanking: null,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Submit a vote for a poll
  async submitPollVote(userUUID: string, voteInp: VoteInput) {
    try {
      const { questionUUID, vote } = voteInp;

      const question = await this.questionModel
        .findOne({ questionUUID })
        .exec();

      // Check if the question exists
      if (!question) {
        throw new BadRequestException(
          `Question with ID ${questionUUID} not found`,
        );
      }

      // Validate that the vote is one of the allowed values in the options array
      const isValidVote = question.options.some(
        (option) => option.value === vote,
      );

      if (!isValidVote) {
        throw new BadRequestException(
          `Invalid vote value. Please select one of the available options for the question.`,
        );
      }

      // Check if the user has already voted for this question
      const hasVoted = question.votes.some((v) => v.voterUUID === userUUID);
      if (hasVoted) {
        throw new BadRequestException(
          `User has already voted for question with ID ${questionUUID}`,
        );
      }

      // Add the vote to the question
      question.votes.unshift({
        voterUUID: userUUID,
        vote,
      });

      // Save the updated question
      await question.save();

      // Return the updated statistics for this question
      return await this.getPollVoteStatistic(question);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get vote statistics
  async getPollVoteStatistic(
    question: QuestionDocument,
  ): Promise<SubmitVoteRes> {
    const totalVotes = question.votes.length;

    // Calculate percentage for each option
    const statistics = question.options.map((option) => {
      // Count the votes for this option
      const voteCount = question.votes.filter(
        (vote) => vote.vote === option.value,
      ).length;

      // Calculate percentage and round to 2 decimal places
      const percentage = totalVotes ? (voteCount / totalVotes) * 100 : 0;
      return {
        option: option.value,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });

    return {
      questionUUID: question.questionUUID,
      question: question.question,
      options: question.options,
      statistics,
    };
  }

  // Get game questions
  async getGameQuestions(questionUUIDs: string[]): Promise<QuestionDocument[]> {
    try {
      const questions = await this.questionModel
        .find({
          questionUUID: {
            $in: questionUUIDs,
          },
        })
        .select('-_id -createdAt -updatedAt -presentedTo')
        .exec(); // Using index

      return questions;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  // Get array of question uuid strings or questions
  async getQuestionIds(
    subcategory: string[],
    totalQuestion = 10,
    isUntimeQuiz = false,
  ) {
    try {
      const pipeline: any = [
        { $match: { 'subcategory.id': { $in: subcategory } } },
        { $sample: { size: totalQuestion } },
      ];

      if (!isUntimeQuiz) {
        pipeline.push(
          { $group: { _id: null, questionUUIDs: { $push: '$questionUUID' } } },
          { $project: { _id: 0, questionUUIDs: 1 } }, // Project only the questionUUIDs field, exclude _id
        );
      }

      const result = await this.questionModel.aggregate(pipeline).exec();

      if (isUntimeQuiz) {
        // Shuffle options array and add question number
        result.forEach((question, index) => {
          question.options = shuffle(question.options);
          question.questionNumber = index + 1;
        });

        // Return questions
        return result;
      } else {
        if (result.length === 0 || result[0].questionUUIDs.length === 0) {
          throw new NotFoundException(
            'No questions found for the given subcategory',
          );
        }

        // Return array of question uuid strings
        return result[0].questionUUIDs;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get performance
  async getPerformance(user: UserDocument, quiz?: string) {
    try {
      return await this.userService.getPerformance(user, quiz);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Review answers
  async reviewAnswers(page?: number, limit?: number) {
    try {
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Decrypt questions (Dev Only)
  async decryptQuestion(encryptedQuestion: string): Promise<QuestionDocument> {
    try {
      const decryptAnswer = this.cryptoService.decryptAnswer(encryptedQuestion);

      return JSON.parse(decryptAnswer);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upload images to questions
  async uploadImageToQuestion(
    user: UserDocument,
    files: FileUpload[],
  ): Promise<UploadQsImageRes> {
    try {
      // Reject image upload if user is not subscribe
      if (user?.subscription?.plan === SubPlanType.STARTER)
        throw new BadRequestException(
          'Please upgrade your plan to upload an image.',
        );

      // Check if upload is more than 5 images
      if (files?.length > 5)
        throw new BadRequestException(
          'A maximum of five images is allowed per question.',
        );

      // Process each uploaded file
      const secure_urls = await Promise.all(
        files.map(async (file) => {
          const { createReadStream } = await file;
          const stream = createReadStream();

          const { secure_url } = await this.awsS3Service.uploadImage(
            'question-images',
            stream,
          );

          return secure_url;
        }),
      );

      return { imageUrls: secure_urls };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete images to questions
  async deleteImageFromQuestion(
    userId: ObjectId,
    imageUrls: string[],
    questionUUID?: string,
  ): Promise<{ message: string }> {
    try {
      if (questionUUID) {
        const question = await this.getOneQuestion(userId, questionUUID);

        // Remove the URLs from the question's image array
        question.images = question.images.filter(
          (imageUrl) => !imageUrls.includes(imageUrl),
        );

        // Save the updated question
        await question.save();
      }

      // Delete images from S3
      await this.awsS3Service.deleteFiles(imageUrls);

      return { message: 'Image(s) deleted successfully.' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Validate response (Check for duplicate question ID)
  validateResponse(responses: ResponseInput[]) {
    try {
      const questionUUIDs = new Set<string>();

      responses.forEach((response) => {
        if (questionUUIDs.has(response?.questionUUID)) {
          throw new BadRequestException(
            'Duplicate or invalid question ID detected!',
          );
        }

        questionUUIDs.add(response?.questionUUID);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateQuestion(question: UpdateQuestion) {
    if (!question.questionUUID && !question.caseUUID && !question.quizUUID)
      throw new BadRequestException(
        'Cannot update question attached to no resource',
      );

    try {
      if (question?.caseUUID) {
        const caseValue = await this.caseModel.exists({
          caseUUID: question.caseUUID,
        });

        if (!caseValue)
          throw new BadRequestException(
            'caseUUID invalid. Unable to update question',
          );
      }

      if (question.quizUUID) {
        // TODO
        return;
      }

      await this.questionModel.updateOne(
        {
          questionUUID: question.questionUUID,
        },
        {
          ...exclude(question, ['questionUUID', 'caseUUID', 'quizUUID']),
        },
      );
      return { message: 'Question updated successfully' };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Get random questions from my question bank to play QB quiz
  async getAllCaseQuestions(
    caseUUID?: string,
    page?: number,
    limit?: number,
  ): Promise<GetMyQuesRes> {
    try {
      const query = { caseUUID: { $ne: null } } as Record<string, any>;

      if (caseUUID) {
        const caseValue = await this.caseModel.findOne({
          $or: [{ caseUUID }, { caseId: caseUUID }],
        });

        query['caseUUID'] = caseValue ? caseValue.caseUUID : caseUUID;
      }

      const questions = await this.questionModel
        .find(query)
        .sort({ _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(); // Using index

      // Get pagination
      const pagination: Pagination = await getPagination(
        this.questionModel,
        query,
        questions,
        limit,
        page,
      );

      return { questions, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

[
  {
    questionUUID: '0e4377df-9791-4003-8ee0-00debcbeaaae',
    statistics: [
      {
        option: 'Larynx',
        percentage: 50,
      },
      {
        option: 'Pharynx',
        percentage: 0,
      },
      {
        option: 'Trachea',
        percentage: 50,
      },
      {
        option: 'Esophagus',
        percentage: 0,
      },
    ],
  },
  {
    questionUUID: '1cd9f134-136d-4dc8-ba2c-326bcb89bfa6',
    statistics: [
      {
        option: 'A',
        percentage: 100,
      },
      {
        option: 'B',
        percentage: 0,
      },
      {
        option: 'AB',
        percentage: 0,
      },
      {
        option: 'O',
        percentage: 0,
      },
    ],
  },
  {
    questionUUID: '1e900af9-b606-4ee7-9739-36ea92503a6e',
    statistics: [
      {
        option: '60-70 beats per minute',
        percentage: 50,
      },
      {
        option: '80-100 beats per minute',
        percentage: 0,
      },
      {
        option: '100-120 beats per minute',
        percentage: 50,
      },
      {
        option: '120-140 beats per minute',
        percentage: 0,
      },
    ],
  },
  {
    questionUUID: '4bb3d8a8-a063-4f26-acb4-4bdcb58e263d',
    statistics: [
      {
        option: 'Vitamin A',
        percentage: 0,
      },
      {
        option: 'Vitamin C',
        percentage: 50,
      },
      {
        option: 'Vitamin D',
        percentage: 0,
      },
      {
        option: 'Vitamin E',
        percentage: 50,
      },
    ],
  },
  {
    questionUUID: '5e765986-d504-40df-9e98-0b5948fc45cc',
    statistics: [
      {
        option: 'A',
        percentage: 0,
      },
      {
        option: 'B',
        percentage: 0,
      },
      {
        option: 'AB',
        percentage: 100,
      },
      {
        option: 'O',
        percentage: 0,
      },
    ],
  },
  {
    questionUUID: '8df0e03c-caf6-4a05-ab6c-77c7a768f1c7',
    statistics: [
      {
        option: 'Heart',
        percentage: 0,
      },
      {
        option: 'Nose',
        percentage: 0,
      },
      {
        option: 'Skin',
        percentage: 100,
      },
      {
        option: 'Liver',
        percentage: 0,
      },
    ],
  },
  {
    questionUUID: 'c0a8aa5e-e89b-4855-8f81-ee01aac035e8',
    statistics: [
      {
        option: 'Vitamin A',
        percentage: 0,
      },
      {
        option: 'Vitamin C',
        percentage: 100,
      },
      {
        option: 'Vitamin D',
        percentage: 0,
      },
      {
        option: 'Vitamin E',
        percentage: 0,
      },
    ],
  },
  {
    questionUUID: 'ceb9e251-15ae-4b95-af0e-ffe4f0f0f90b',
    statistics: [
      {
        option: 'Larynx',
        percentage: 100,
      },
      {
        option: 'Pharynx',
        percentage: 0,
      },
      {
        option: 'Trachea',
        percentage: 0,
      },
      {
        option: 'Esophagus',
        percentage: 0,
      },
    ],
  },
  {
    questionUUID: 'e7a5b12a-1fa0-479b-8105-82403516d957',
    statistics: [
      {
        option: 'Heart',
        percentage: 0,
      },
      {
        option: 'Nose',
        percentage: 50,
      },
      {
        option: 'Skin',
        percentage: 0,
      },
      {
        option: 'Liver',
        percentage: 50,
      },
    ],
  },
  {
    questionUUID: 'fd9e6bd2-e348-4ce6-8eb4-7f7efffa5da8',
    statistics: [
      {
        option: '60-70 beats per minute',
        percentage: 0,
      },
      {
        option: '80-100 beats per minute',
        percentage: 0,
      },
      {
        option: '100-120 beats per minute',
        percentage: 0,
      },
      {
        option: '120-140 beats per minute',
        percentage: 100,
      },
    ],
  },
];
