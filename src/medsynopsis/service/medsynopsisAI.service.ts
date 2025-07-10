/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  MedScoreRecordInput,
  UserCaseUploadInput,
} from 'src/medsynopsis/dto/medsynopsis.input';
import { IMedSynopsisCase } from 'src/medsynopsis/entity/types.entity';
import { MedSynopsisUserScoreEntity } from 'src/medsynopsis/entity/medsynopsisUserScore.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import ShortUniqueId from 'short-unique-id';
import {
  MedAISummaryRes,
  MedSynopsisUserCaseRes,
  MedUserScoreRes,
  RandomQuestionRes,
} from 'src/medsynopsis/types/medsynopsis.type';
import { MedSynopsisService } from 'src/medsynopsis/service/medsynopsis.service';
import {
  MedSynopsisUserCaseDocument,
  MedSynopsisUserCaseEntity,
} from 'src/medsynopsis/entity/medsynopsisUserCase.entity';
import {
  defaultUserCasePrompt,
  medSynopsisPrompt,
  userOwnPrompt,
} from '../constant/ai-prompt';
import { ThreadMessageInput } from 'src/llm-providers/openAI/dto/assistant.input';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import {
  calculateTimeScore,
  isValidJSON,
} from 'src/utilities/service/helpers.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeaderBoardEventsType } from 'src/quiz/enum/quiz.enum';
import { UserDocument } from 'src/user/entity/user.entity';

@Injectable()
export class MedSynopsisAIService {
  private readonly openai: OpenAI;
  private readonly maxToken: number;
  private readonly uid = new ShortUniqueId({ length: 16 });

  constructor(
    @Inject(forwardRef(() => MedSynopsisService))
    private medSynopsisService: MedSynopsisService,
    @InjectModel(MedSynopsisUserScoreEntity.name)
    private medUserScoreModel: Model<MedSynopsisUserScoreEntity>,
    @InjectModel(MedSynopsisUserCaseEntity.name)
    private medUserCaseModel: Model<MedSynopsisUserCaseEntity>,
    private asstThreadService: AsstThreadService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.maxToken = 4096;
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  // Generate summary score
  async generateMedSummaryScore(
    payload: MedScoreRecordInput,
    user: UserDocument,
    threadId: string,
  ): Promise<MedUserScoreRes> {
    try {
      const { caseUUID, userSummary, gameType, categoryName, completionTime } =
        payload;

      const assignedTime = '15:00';

      const thread_id = threadId;

      const threadMessageInput: ThreadMessageInput = {
        threadId: '',
        message: '',
      };

      const getMedCaseData: IMedSynopsisCase =
        await this.medSynopsisService.getMedsynopsisCaseByUUID(caseUUID);

      const { caseSummary, caseContent } = getMedCaseData;

      const existingUserMedScore =
        await this.medSynopsisService.getUserAllMedSynopsisScores(
          user.userUUID,
        );

      const getUserMedCaseScoreIfExist =
        await this.medSynopsisService.getUserMedSynopsisScore(
          user.userUUID,
          caseUUID,
        );

      if (!caseSummary && !userSummary)
        throw new BadRequestException('Prompt cannot be empty.');
      const timeCompletionSpeedScore = calculateTimeScore(
        // assignedTime,
        completionTime,
      );

      threadMessageInput.threadId = thread_id;
      threadMessageInput.message = medSynopsisPrompt(caseContent, userSummary);

      const {
        message: content,
        threadId: chatThreadId,
        messageId,
      } = await this.asstThreadService.addMessage(
        user,
        threadMessageInput,
        ComponentType.MEDSYNOPSIS,
      );

      const generatedResponse = JSON.parse(content);

      const scoreData: MedAISummaryRes = generatedResponse?.score;
      // const scoreData: MedAISummaryRes = generatedResponse[0]?.score;
      const feedback = generatedResponse?.feedback;

      let result: MedUserScoreRes;

      if (content) {
        const setScore = {
          accuracy: scoreData['Accuracy'] || 0,
          clarityConciseness: scoreData['Clarity and Conciseness'] || 0,
          relevance: scoreData['Relevance'] || 0,
          organizationStructure: scoreData['Organization and Structure'] || 0,
          completionTime: timeCompletionSpeedScore,
        };
        const totalScore =
          (scoreData['Total Score'] || 0) + timeCompletionSpeedScore;

        if (existingUserMedScore && getUserMedCaseScoreIfExist.length > 0) {
          const {
            score: previousScore,
            gameType: previousGameType,
            totalUntimedScore,
            totalTimedScore,
          } = getUserMedCaseScoreIfExist[0];
          const setNewScore =
            previousScore < totalScore ? totalScore : previousScore;
          const scoreDifference =
            previousScore < totalScore ? totalScore - previousScore : 0;

          //Section for removing and adding new score difference to exisiting score with same caseUUId
          let newTimedScore = totalTimedScore;
          let newUntimedScore = totalUntimedScore;

          const adjustScores = () => {
            if (gameType === 'timed' && previousGameType === 'timed') {
              if (previousScore < totalScore) {
                newTimedScore += scoreDifference;
              }
            } else if (
              gameType === 'untimed' &&
              previousGameType === 'untimed'
            ) {
              if (previousScore < totalScore) {
                newUntimedScore += scoreDifference;
              }
            } else if (gameType === 'timed' && previousGameType === 'untimed') {
              newUntimedScore -= previousScore;
              newTimedScore += totalScore;
            } else if (gameType === 'untimed' && previousGameType === 'timed') {
              newTimedScore -= previousScore;
              newUntimedScore += totalScore;
            }
          };

          adjustScores();

          const bulkOps = [
            {
              updateOne: {
                filter: {
                  userUUID: user.userUUID,
                  'userData.categoryName': categoryName,
                  'userData.content.caseUUID': caseUUID,
                },
                update: {
                  $set: {
                    'userData.$[user].content.$[content].scoreRecord': setScore,
                    'userData.$[user].content.$[content].score': setNewScore,
                    'userData.$[user].content.$[content].userSummary':
                      userSummary,
                    'userData.$[user].content.$[content].assignedTime':
                      assignedTime,
                    'userData.$[user].content.$[content].completionTime':
                      completionTime,
                    'userData.$[user].content.$[content].gameType': gameType,
                    'userData.$[user].totalTimedScore': newTimedScore,
                    'userData.$[user].totalUntimedScore': newUntimedScore,
                  },
                  $inc: {
                    'userData.$[user].totalScore': Number(scoreDifference),
                    // 'userData.$[user].totalTimedScore': gameType === previousGameType ? - previousScore : 0),
                    // 'userData.$[user].totalUntimedScore': gameType === 'untimed' ? Number(scoreDifference) : (previousGameType === 'untimed' ? -previousScore : 0),
                  },
                },
                arrayFilters: [
                  { 'user.categoryName': categoryName },
                  { 'content.caseUUID': caseUUID || null },
                ],
              },
            },
          ];

          await this.medUserScoreModel
            .bulkWrite(bulkOps)
            .then(async (res) => {
              result = {
                score: totalScore,
                scoreSummary: setScore,
                userSummary,
                caseAISummary: caseSummary,
                aIFeedback: feedback,
                chatThreadId,
              };
              user.quizzer.totalPoints += Number(scoreDifference);
              this.eventEmitter.emit(LeaderBoardEventsType.ADD_SCORE, {
                user,
                region: '',
                component: 'MEDSYNOPSIS',
                points: Number(scoreDifference),
                timeTaken: 0,
              });

              // Mark quizzer field as modify
              user.markModified('quizzer');
              await user.save();
            })
            .catch((error) => {
              throw new BadRequestException(
                error?.message || 'Unable to update user score!',
              );
            });
        } else if (
          existingUserMedScore &&
          getUserMedCaseScoreIfExist.length === 0
        ) {
          // Update the existing user score
          await this.medUserScoreModel
            .updateOne(
              {
                userUUID: user.userUUID,
                'userData.categoryName': categoryName,
              },
              {
                $push: {
                  'userData.$.content': {
                    caseUUID,
                    userSummary,
                    scoreRecord: setScore,
                    assignedTime,
                    gameType,
                    completionTime,
                    score: totalScore,
                  },
                },
                $inc: {
                  'userData.$.totalScore': totalScore,
                  'userData.$.totalTimedScore':
                    gameType === 'timed' ? totalScore : 0,
                  'userData.$.totalUntimedScore':
                    gameType === 'untimed' ? totalScore : 0,
                },
              },
            )
            .then(async (res) => {
              result = {
                score: totalScore,
                scoreSummary: setScore,
                userSummary,
                caseAISummary: caseSummary,
                aIFeedback: feedback,
                chatThreadId,
              };

              user.quizzer.totalPoints += totalScore;
              user.quizzer.totalQA += 1;

              this.eventEmitter.emit(LeaderBoardEventsType.ADD_SCORE, {
                user,
                region: '',
                component: 'MEDSYNOPSIS',
                points: Number(totalScore),
                timeTaken: 0,
              });

              // Mark quizzer field as modify
              user.markModified('quizzer');
              await user.save();
            })
            .catch((error) => {
              throw new BadRequestException(
                error?.message || 'Failed to update existing user score.',
              );
            });
        } else {
          // Create a new user score record
          const newUserScore = new this.medUserScoreModel({
            userUUID: user.userUUID,
            userData: [
              {
                categoryName,
                content: [
                  {
                    caseUUID,
                    userSummary,
                    scoreRecord: setScore,
                    assignedTime,
                    completionTime,
                    gameType,
                    score: totalScore,
                  },
                ],
                totalScore: totalScore,
                totalTimedScore: gameType === 'timed' ? totalScore : 0,
                totalUntimedScore: gameType === 'untimed' ? totalScore : 0,
              },
            ],
          });

          await newUserScore
            .save()
            .then(async (res) => {
              result = {
                score: totalScore,
                scoreSummary: setScore,
                userSummary,
                caseAISummary: caseSummary,
                aIFeedback: feedback,
                chatThreadId,
              };

              user.quizzer.totalPoints += totalScore;
              user.quizzer.totalQA += 1;

              this.eventEmitter.emit(LeaderBoardEventsType.ADD_SCORE, {
                user,
                region: '',
                component: 'MEDSYNOPSIS',
                points: Number(totalScore),
                timeTaken: 0,
              });

              // Mark quizzer field as modify
              user.markModified('quizzer');
              await user.save();
            })
            .catch((error) => {
              throw new BadRequestException(
                error?.message || 'An unexpected error occured!',
              );
            });
        }

        return result;
      } else {
        throw new BadRequestException('No content returned from the AI model.');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  getRandomCase(cases: any): any {
    const randomIndex = Math.floor(Math.random() * cases.length);
    return cases[randomIndex];
  }

  async generateRandomMedSynopsisQuestions(): Promise<RandomQuestionRes> {
    try {
      // Fetch all cases
      const allCases = await this.medSynopsisService.getMedsynopsisCases();

      // Randomly select a case
      const randomCase = this.getRandomCase(allCases?.cases);

      const { caseUUID, caseSummary, caseContent, categoryUUID, caseTitle } =
        randomCase;
      const foundCategory = await this.medSynopsisService.getMedCategory(
        categoryUUID,
      );

      const { title: categoryName } = foundCategory;

      return {
        caseUUID,
        caseContent,
        categoryUUID,
        caseTitle,
        categoryName,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async generateMedUserCaseSummary(
    payload: UserCaseUploadInput,
    file,
    user: UserDocument,
  ): Promise<MedSynopsisUserCaseRes> {
    try {
      const { userUUID, userPrompt, threadId } = payload;

      const threadMessageInput: ThreadMessageInput = {
        threadId: '',
        message: '',
      };
      const prompt = userPrompt
        ? userOwnPrompt(userPrompt)
        : defaultUserCasePrompt();

      if (!prompt) throw new BadRequestException('Prompt cannot be empty.');

      threadMessageInput.threadId = threadId;
      threadMessageInput.message = prompt;

      let content: any;
      let chatThreadId;
      let fileUrl;
      let messageId;

      if (file) {
        const {
          message,
          threadId: generatedThreadId,
          ThreadMessageId,
          fileUrl: filePathUrl,
        } = await this.asstThreadService
          .addMessage(
            user,
            threadMessageInput,
            ComponentType.USER_MEDSYNOPSIS,
            null,
            [file],
            'medsynopsis-user-case-file',
          )
          .catch((error) => {
            console.log('the error', error);
          });

        fileUrl = filePathUrl;
        chatThreadId = generatedThreadId;
        content = message;
        messageId = ThreadMessageId;
      } else if (!file && threadId) {
        const {
          message,
          threadId: generatedThreadId,
          ThreadMessageId,
          filePathUrl,
        } = await this.asstThreadService
          .addMessage(
            user,
            threadMessageInput,
            ComponentType.USER_MEDSYNOPSIS,
            null,
            null,
            null,
          )
          .catch((error) => {
            console.log('the error', error);
          });

        fileUrl = filePathUrl;
        chatThreadId = generatedThreadId;
        content = message;
        messageId = ThreadMessageId;
      } else if (!file && !threadId) {
        throw new BadRequestException(
          'Please supply a file or thread ID to continue',
        );
      }

      if (!isValidJSON(content))
        throw new BadRequestException(
          'Unable to generating response at this time. Please try again later.',
        );

      const summarizedContent = JSON.parse(content);

      if (summarizedContent) {
        // Check if the user already exists in the database
        const existingUserCase = await this.medUserCaseModel.findOne({
          userUUID,
        });

        const newCase = {
          caseContent: summarizedContent?.providedContent,
          userSummary: summarizedContent?.summary,
          fileUrl: fileUrl,
          caseID: this.uid.rnd(),
          threadId: chatThreadId,
          messageId,
        };

        if (existingUserCase) {
          // Push the new summarized content to the userData array
          existingUserCase.userData.push(newCase);
          await existingUserCase.save().catch((error) => {
            throw new BadRequestException(
              error?.message || 'An unexpected error occured!',
            );
          });
        } else {
          // Create a new record if the user doesn't exist
          const newUserCase = new this.medUserCaseModel({
            userUUID,
            userData: [newCase],
          });
          await newUserCase.save().catch((error) => {
            throw new BadRequestException(
              error?.message || 'An unexpected error occured!',
            );
          });
        }
        return newCase;
      } else {
        throw new BadRequestException('No content returned from the AI model.');
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //Method used for updating an exisiting user uploaded case
  async updategenerateMedUserCaseSummary(
    payload: Partial<UserCaseUploadInput>,
    file,
    caseID: string,
    user: UserDocument,
  ): Promise<MedSynopsisUserCaseDocument> {
    try {
      const { userUUID, userPrompt, threadId, messageId } = payload;

      const threadMessageInput: ThreadMessageInput = {
        threadId: null,
        message: null,
      };
      const prompt = userPrompt
        ? userOwnPrompt(userPrompt)
        : defaultUserCasePrompt();

      if (!prompt) throw new BadRequestException('Prompt cannot be empty.');

      threadMessageInput.threadId = threadId;
      threadMessageInput.message = prompt;

      const { message: content } = await this.asstThreadService.addMessage(
        user,
        threadMessageInput,
        ComponentType.USER_MEDSYNOPSIS,
        null,
        file ? [file] : [],
        'medsynopsis-user-case-file',
      );

      if (!isValidJSON(content))
        throw new BadRequestException(
          'Unable to generating response at this time. Please try again later.',
        );

      const summarizedContent = JSON.parse(content);

      if (summarizedContent) {
        const updateContent = {
          caseContent: summarizedContent?.providedContent,
          userSummary: summarizedContent?.summary,
        };

        const userCase =
          await this.medSynopsisService.getUserUploadedMedCaseByCaseId(
            userUUID,
            caseID,
          );

        // Update the specific case within the userData array
        await this.medUserCaseModel
          .findOneAndUpdate(
            { userUUID, 'userData.caseID': caseID },
            {
              $set: {
                'userData.$': {
                  ...userCase.userData.find(
                    (caseItem) => caseItem?.caseID === caseID,
                  ),
                  ...updateContent,
                },
              },
            },
            { new: true, upsert: false },
          )
          .exec()
          .then((res: any) => {
            return res;
          })
          .catch((error) => {
            throw new BadRequestException(
              error?.message || 'An unexpected error occured!',
            );
          });
      } else {
        throw new BadRequestException('No content returned from the AI model.');
      }

      return await this.medSynopsisService.getUserUploadedMedCaseByCaseId(
        userUUID,
        caseID,
      );
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
}
