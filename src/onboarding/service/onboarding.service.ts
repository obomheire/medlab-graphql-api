/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  UserSettingDocument,
  UserSettingEntity,
} from '../entity/userSetting.entity';
import { InjectModel } from '@nestjs/mongoose';
import { onboardingQuestions } from '../constant/questions.constant';
import { AskQuestionRes, OptionType } from '../types/oboarding.types';
import { AskQuestionInput } from '../dto/onboarding.dto';
import { UserDocument, UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/service/user.service';
import { QuizService } from 'src/quiz/service/quiz.service';
import { PositionService } from 'src/user/service/position.service';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(UserSettingEntity.name)
    private readonly userSettingModel: Model<UserSettingDocument>,
    private userService: UserService,
    private quizService: QuizService,
    private positionService: PositionService,
  ) {}

  async getUserSetting(userId: ObjectId): Promise<UserSettingDocument> {
    return await this.userSettingModel.findOne({ userId }).exec();
  }

  async askQuestion(
    user: UserDocument,
    conversationRes?: AskQuestionInput,
  ): Promise<AskQuestionRes> {
    const userId = user._id;
    const foundSettings = await this.getUserSetting(userId);

    if (conversationRes !== undefined && conversationRes !== null) {
      if (foundSettings) {
        foundSettings.userChat.push(conversationRes);
        user.personalized = true;
        if (conversationRes?.progress === 2) {
          user.heardAboutUs = conversationRes?.userResponse;
        }
        if (conversationRes?.progress === 4) {
          user.role = conversationRes?.userResponse;
        }
        if (conversationRes?.progress === 3) {
          user.firstName = conversationRes?.userResponse;
          user.username = conversationRes?.userResponse;
        }
        if (conversationRes?.progress === 5) {
          user.specialty = conversationRes?.userResponse;
        }
        if (
          conversationRes?.progress === 6 ||
          conversationRes?.progress === 7
        ) {
          user.subspecialty = conversationRes?.userResponse;
        }
        if (conversationRes?.progress === 8) {
          user.interest = conversationRes?.userResponse;
        }

        await foundSettings.save();
      } else {
        const newUserSetting = new this.userSettingModel({
          userId,
          userChat: [conversationRes],
          progress: conversationRes.progress,
        });
        await newUserSetting.save();
      }
      await user.save();
    }

    const { data: nextQuestion, progress } = await this.getQuestionByProgress(
      foundSettings,
      user,
    );

    if (foundSettings) {
      foundSettings.progress = progress;
      await foundSettings.save();
    }

    return nextQuestion;
  }

  async getQuestionByProgress(
    foundSetting: UserSettingEntity,
    user: UserEntity,
  ): Promise<{ data: AskQuestionRes; progress: number }> {
    let response: AskQuestionRes | null = null;
    let currentProgress = foundSetting?.progress || 0;

    const getGeneralTriviaUUID = await this.quizService.getQuizByCategoryName(
      'General Trivia',
    );
    const { quizUUID } = getGeneralTriviaUUID;
    const subspecialties =
      await this.positionService.getAllSpecialtiesForOnboarding();

    const lastProgress =
      foundSetting?.userChat[foundSetting?.userChat?.length - 1]?.progress || 1;
    const lastResponse =
      foundSetting?.userChat[foundSetting?.userChat?.length - 1]?.userResponse;

    const last2Response =
      foundSetting?.userChat[foundSetting?.userChat?.length - 2]?.userResponse;

    if (!foundSetting) {
      response = onboardingQuestions.find((res) => res.progress === 1);
      currentProgress = 1;
    } else {
      if (lastProgress < 3) {
        if (lastProgress < 2) {
          // this checks if the last is less than 2 and increment next progress by 1
          response = onboardingQuestions.find(
            (res) => res.progress === lastProgress + 1,
          );
        } else if (lastProgress === 2) {
          // if last progress is 2, we want to check if the user name is not empty
          if (user.firstName || user.username) {
            //if user name is not empty, move progress to 4
            response = onboardingQuestions.find((res) => res.progress === 4);
            currentProgress = 4;
          } else {
            // else pressent the user with the progress 3
            response = onboardingQuestions.find((res) => res.progress === 3);
            currentProgress = 3;
          }
        }
      } else if (lastProgress === 3) {
        //if last progress is 3, then move the user to the next progress
        response = onboardingQuestions.find((res) => res.progress === 4);
      } else if (lastProgress === 4 && lastResponse === 'Doctor') {
        // if last progress was 4 and the user input is Doctor, move to the next
        const found = onboardingQuestions.find((res) => res.progress === 5);
        found.options = subspecialties;
        response = found;
      } else if (lastProgress === 4 && lastResponse === 'Nurse') {
        //else if the last progress was 4 and the user input was Nurse, move to this block
        response = onboardingQuestions.find((res) => res.progress === 7);
      } else if (lastProgress === 5 && last2Response === 'Doctor') {
        //if last progress was 5 and the last 2 progress respopnse was Doctor, enter this block and present the user with progress 6
        const found = onboardingQuestions.find((res) => res.progress === 6);
        const temp = subspecialties.filter(
          (result: OptionType) =>
            result?.title?.toLowerCase() === lastResponse?.toLowerCase(),
        );
        const sub = temp[0]?.subspecialties.map((subspecialty) => {
          return {
            title: subspecialty,
            route: subspecialty,
            key: null,
            subspecialties: [],
          };
        });

        found.options = sub;
        response = found;
      } else if (
        lastProgress === 4 &&
        lastResponse !== 'Doctor' &&
        lastResponse !== 'Nurse'
      ) {
        // if last progress is 4 and the user input was neither Doctor or Nurse, move to progress 8
        const found = onboardingQuestions.find((res) => res.progress === 8);
        found?.options?.map((res) => {
          if (res.title === 'General Trivia') {
            res.key = quizUUID;
          }
          return res;
        });
        response = found;
      } else if (lastProgress === 6 || lastProgress === 7) {
        //if last progress is either 6 or 7, move the user to progress 8
        const found = onboardingQuestions.find((res) => res.progress === 8);
        found?.options?.map((res) => {
          if (res.title === 'General Trivia') {
            res.key = quizUUID;
          }
          return res;
        });
        response = found;
      } else {
        const found = onboardingQuestions.find((res) => res.progress === 8);
        found?.options?.map((res) => {
          if (res.title === 'General Trivia') {
            res.key = quizUUID;
          }
          return res;
        });
        response = found;
      }
    }

    return {
      data: response,
      progress: currentProgress + 1,
    };
  }

  // Delete all user setings
  async deleteAllUserSettings(userId: ObjectId) {
    try {
      const settings = await this.userSettingModel.deleteMany({ userId });

      return {
        count: settings.deletedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
