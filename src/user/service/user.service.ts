import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, UserEntity } from '../entity/user.entity';
import { Model } from 'mongoose';
import { GetOtpInput } from 'src/auth/dto/auth.input';
import { MailService } from 'src/mail/mail.service';
import { AuthService } from 'src/auth/service/auth.service';
import { ContactUsInput, ResetPasswordInput } from '../dto/user.input';
import { RegData, UserRanking } from 'src/utilities/interface/interface';
import { ConfigService } from '@nestjs/config';
import {
  accountStatus,
  caseResults,
  clinExStarterPlan,
  quizzer,
  slideStarterPlan,
  starterPlan,
  threads,
} from '../constant/user.constant';
import ShortUniqueId from 'short-unique-id';
import { ObjectId } from 'mongodb';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eventEmitterType } from 'src/utilities/enum/env.enum';
import { PermissionsType } from '../enum/user.enum';
import { AppType } from 'src/stripe/enum/sub.plan.enum';
import { v4 as uuidv4 } from 'uuid';
import { dynamicTemplates } from 'src/mail/email.constant';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';

@Injectable()
export class UserService {
  private readonly uid = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Create user
  async createUser(
    regData: RegData,
    hashedPassword?: string,
    isApple?: boolean,
    isFacebook?: boolean,
  ) {
    try {
      const { id, firstName, lastName, email, picture, guestUUID } = regData;

      // Determine password
      const passwordHash =
        hashedPassword ||
        (await this.authService.hashData(
          this.configService.get<string>('PASSWORD_SECRET'),
        ));

      // Get unique username
      const username = await this.getUserName(firstName, lastName);

      if (guestUUID) {
        const isGuestUser = await this.getGuestUser(guestUUID);

        if (isGuestUser) {
          Object.assign(isGuestUser, {
            isGuest: false,
            firstName,
            lastName: lastName ?? '',
            email: email?.toLowerCase(),
            profileImage: picture ?? null,
            username,
            password: passwordHash,
            permissions: [PermissionsType.USER],
            personalized: false,
            accountStatus: {
              isDisabled: false,
              dateDisabled: null,
            },
            ...(isFacebook && { facebookId: id }),
            ...(isApple && { appleId: id }),
          });

          isGuestUser.markModified('accountStatus');
          return await isGuestUser.save();
        }
      }

      // Define user data object
      const userData: UserEntity = {
        ...regData,
        username,
        password: passwordHash,
        profileImage: picture || null,
        email: email ? email.toLowerCase() : `${username}@email.com`,
        country: {
          country: null,
          code: null,
        },
        caseResults,
        subscription: starterPlan,
        slideSub: slideStarterPlan,
        clinExSub: {
          ...clinExStarterPlan,
          isTrialLC: true,
          isTrialSC: true,
          tokenBalance: 50000,
          topUpCredits: 50000,
        },
        usedResources: {
          questions: 0,
          storage: 0,
          credits: 50000,
        },
        quizzer,
        accountStatus,
        threads,
        ...(isFacebook && { facebookId: id }),
        ...(isApple && { appleId: id }),
      };

      const createdUser = new this.userModel(userData);

      return await createdUser.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Continue as guest
  async continueAsGuest() {
    try {
      // Get unique username
      const username = await this.getUserName('Guest');

      // Define user data object
      const userData: UserEntity = {
        firstName: 'Guest',
        username,
        email: `${username}@email.com`,
        isGuest: true,
        country: {
          country: null,
          code: null,
        },
        caseResults,
        personalized: true,
        subscription: starterPlan,
        slideSub: slideStarterPlan,
        clinExSub: clinExStarterPlan,
        usedResources: {
          questions: 0,
          storage: 0,
          credits: 50000,
        },
        quizzer,
        permissions: [PermissionsType.GUEST],
        accountStatus: {
          isDisabled: true,
          dateDisabled: new Date(new Date().setDate(new Date().getDate() - 13)),
        },
        threads,
      };

      const createdUser = new this.userModel(userData);

      return await createdUser.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Forgot password
  async forgotPassword({ email }: GetOtpInput) {
    try {
      const user = await this.getUserByEmail(email);

      return await this.authService.sendOtp(
        user,
        dynamicTemplates.otpLoginTemplate,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Reset user password
  async resetPassword(
    resetPasswordInput: ResetPasswordInput,
  ): Promise<{ message: string }> {
    try {
      const { newPassword, email, otp } = resetPasswordInput;

      //check if otp is valid
      const user = await this.getUserByEmail(email);

      const isOtpValid = await this.authService.validateOtp(otp, user);

      if (!isOtpValid) throw new ForbiddenException('Invalid OTP!');

      //hash password
      const hashedPassword = await this.authService.hashData(newPassword);

      user.password = hashedPassword;
      await user.save();

      return {
        message: 'Password reset successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update user's refresh token
  async updateAccessToken(
    userUUID: string,
    hashedRefreshToken: string,
  ): Promise<UserDocument> {
    try {
      return await this.userModel
        .findOneAndUpdate(
          { userUUID },
          { refreshToken: hashedRefreshToken },
          { new: true }, // Return the updated document
        )
        .exec();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get user by UUID
  async getUserByUUID(userUUID: string) {
    try {
      if (!userUUID) throw new BadRequestException('User UUID is required!');

      const user = await this.userModel.findOne({ userUUID }).exec();

      if (!user) throw new NotFoundException('User not found!');

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get guest user by UUID
  async getGuestUser(guestUUID: string) {
    try {
      return await this.userModel.findOne({ guestUUID }).exec();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get user by ObjectId
  async getUserByObjectId(userId: ObjectId): Promise<UserDocument> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) throw new NotFoundException('User not found!');

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all users
  async getUsers(offset: number, BATCH_SIZE: number) {
    try {
      // Test fetch users
      const users = await this.userModel
        .find({
          email: {
            $in: [
              'obomheire@gmail.com',
              // 'xnotime247@gmail.com',
            ],
          },
        })
        .exec();

      // // Send in production
      // const users = await this.userModel
      //   .find({})
      //   .skip(offset)
      //   .limit(BATCH_SIZE)
      //   .exec();

      return users;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get clinical exams registered users
  async getClinExUsers(): Promise<UserDocument[]> {
    try {
      const clinExUsers = await this.userModel.aggregate([
        {
          $match: {
            app: AppType.MEDSCROLL_CLINICAL_EXAMS,
          },
        },
        {
          $project: {
            email: 1,
            'stripeClinExCust.createdAt': 1,
            'stripeClinExCust.stripeSub.stripeSubStatus': 1,
          },
        },
      ]);

      return clinExUsers as UserDocument[];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get users to delete
  async getUsersToDelete() {
    try {
      // const users = await this.userModel.find({
      //   email: 'samuel.momoh@loopscribe.com',
      // }); // Using index

      const users = await this.userModel.find({
        'accountStatus.isDisabled': true,
        'accountStatus.dateDisabled': {
          // $lte: new Date(new Date().setMinutes(new Date().getMinutes() - 1)), // look for 1 minute old record
          $lte: new Date(new Date().setDate(new Date().getDate() - 14)), // look for 14 days old record
        },
      }); // Using index

      return users;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get user by email or username
  async getUserByEmail(email: string, app?: AppType): Promise<UserDocument> {
    try {
      if (!email) throw new BadRequestException('Email is required!');

      const user = await this.userModel.findOne({
        email: email.toLowerCase(),
      });

      if (!user) throw new NotFoundException('User not found!');

      if (app) {
        // Determine the customer field dynamically based on the app type
        const stripeCusField =
          app === AppType.MEDSCROLL_SLIDE
            ? 'stripeSlideCust'
            : AppType.MEDSCROLL_CLINICAL_EXAMS
            ? 'stripeClinExCust'
            : 'stripeCustomer';

        const { [stripeCusField]: stripeCustomer } = user;

        // Check if stripe customer exist
        if (!stripeCustomer?.stripeCustomerId)
          throw new NotFoundException(
            'Customer has not subscribe to any plan.',
          );
      }

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // get username
  async getUserName(firstName: string, lastName = '') {
    try {
      // Use first name and last name to create a username and remove any white space
      let username = `${firstName}${lastName}`.replace(/\s/g, '').toLowerCase();

      // Check if username exist, if yes, generate a random 4 digit number and concatenate with username.
      let isUserNameExist = await this.userModel.findOne({
        username,
      });

      while (isUserNameExist) {
        const random = Math.floor(1000 + Math.random() * 9000);
        username = `${firstName}${lastName}${random}`
          .replace(/\s/g, '')
          .toLowerCase();
        isUserNameExist = await this.userModel.findOne({
          username,
        });
      }

      return username;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Find if user name exist
  async findUsername(userName: string): Promise<{ message: string }> {
    try {
      const cleanedUsername = userName.replace(/^@+/g, ''); // Remove "@" symbols from the beginning

      const username = `${cleanedUsername.replace(/\s/g, '')}`.toLowerCase();

      const user = await this.userModel.findOne({ username });

      if (user) throw new BadRequestException('Username already exist');

      return { message: 'This username has not been chosen.' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get top ten quizzers
  async topTenQuizzers(user: UserDocument) {
    try {
      const { userUUID } = user;

      const topTen = await this.userModel.aggregate([
        {
          $match: {
            'quizzer.totalPoints': { $gt: 0 }, // Filter out documents without quizzer.totalPoints
          },
        },
        {
          $sort: {
            'quizzer.ranking': 1, // Sort in ascending order of ranking
          },
        },
        {
          $limit: 10, // Limit to the top 10 users
        },
        {
          $project: {
            userUUID: 1,
            name: { $concat: ['$firstName', ' ', '$lastName'] },
            profileImage: 1,
            totalPoints: { $ifNull: ['$quizzer.totalPoints', 0] },
            ranking: { $ifNull: ['$quizzer.ranking', 0] },
            totalTimeTaken: { $ifNull: ['$quizzer.totalTimeTaken', 0] },
          },
        },
      ]); // Using index

      const userExist = topTen.some((user) => user?.userUUID === userUUID); // Check if the userUUID is in the top 10 quizzers

      if (!userExist) {
        topTen.push({
          userUUID: user.userUUID,
          name: `${user?.firstName} ${user?.lastName}`,
          totalPoints: user?.quizzer?.totalPoints,
          totalTimeTaken: user?.quizzer?.totalTimeTaken,
        });
      }

      return topTen;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Calculate performance
  async getPerformance(user: UserDocument, quiz?: string) {
    try {
      const {
        quizzer: { performance, totalTriQues, totalQBques },
      } = user;

      const isQBQuiz = quiz === 'qb';

      const totalQuestions = isQBQuiz ? totalQBques || 0 : totalTriQues || 0;
      const totalCorrect = isQBQuiz
        ? performance?.correctQB || 0
        : performance?.correct || 0;
      const totalIncorrect = isQBQuiz
        ? performance?.incorrectQB || 0
        : performance?.incorrect || 0;
      const totalMissed = isQBQuiz
        ? performance?.missedQB || 0
        : performance?.missed || 0;

      let correct = 0,
        incorrect = 0,
        missed = 0;

      if (totalQuestions > 0) {
        correct = Math.round((totalCorrect / totalQuestions) * 100);
        incorrect = Math.round((totalIncorrect / totalQuestions) * 100);
        missed = Math.round((totalMissed / totalQuestions) * 100);
      }

      return {
        correct,
        incorrect,
        missed,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Calculate ranking for all users
  async calculateRanking(userUUID: string) {
    try {
      const response = await this.userModel
        .aggregate([
          {
            $sort: { 'quizzer.totalPoints': -1, 'quizzer.totalTimeTaken': 1 }, // Sort users by quizzer.totalPoints/quizzer.totalTimeTaken in descending/ascending order
          },
          {
            $group: {
              _id: null,
              users: { $push: '$$ROOT' }, // Push all users into an array
            },
          },
          {
            $set: {
              users: {
                $map: {
                  input: '$users',
                  as: 'user',
                  in: {
                    $mergeObjects: [
                      '$$user',
                      {
                        quizzer: {
                          $mergeObjects: [
                            '$$user.quizzer',
                            {
                              ranking: {
                                $add: [
                                  { $indexOfArray: ['$users', '$$user'] },
                                  1,
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            $unwind: '$users', // Unwind the users array
          },
          {
            $replaceWith: '$users', // Replace the document with the updated user objects
          },
          {
            $project: { userUUID: 1, 'quizzer.ranking': 1 }, // Select require properties
          },
        ])
        .exec();

      // Prepare bulk operations
      const bulkOps = response.map((user) => ({
        updateOne: {
          filter: { userUUID: user.userUUID },
          update: { $set: { 'quizzer.ranking': user.quizzer.ranking } },
        },
      }));

      // Perform bulk update
      if (bulkOps.length > 0) {
        await this.userModel.bulkWrite(bulkOps);
      }

      // find user ranking of the current user
      const userRanking: UserRanking[] = response.filter(
        (user) => user.userUUID === userUUID,
      );

      return { userRanking: userRanking[0]?.quizzer?.ranking };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Deactivate user account
  async deactivateAccount(user: UserDocument): Promise<{ message: string }> {
    try {
      if (user?.accountStatus?.isDisabled)
        throw new BadRequestException('User account is already deactivated');

      user.accountStatus.isDisabled = true;
      user.accountStatus.dateDisabled = new Date();

      // Mark quizzer field as modified
      user.markModified('accountStatus');
      await user.save();

      return {
        message:
          'Your account has been deactivated successfully and is scheduled for permanent deletion in 14 days.',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Add custom category
  async addCustomCategory(
    user: UserDocument,
    customCat: string,
  ): Promise<{ message: string }> {
    try {
      const trimcustomCat = customCat.trim();

      if (!user.customCategory.some((cat) => cat.customCat === trimcustomCat)) {
        user.customCategory.unshift({
          customCatId: this.uid.rnd(),
          customCat: trimcustomCat,
        });

        user.save();
      }

      return {
        message: 'Custom category successfully added',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update custom category
  async updateCustomCategory(
    customCatId: string,
    customCat: string,
  ): Promise<{ message: string }> {
    try {
      const result = await this.userModel.updateOne(
        { 'customCategory.customCatId': customCatId },
        { $set: { 'customCategory.$.customCat': customCat } },
      );

      if (result.matchedCount === 0)
        throw new BadRequestException('Invalid category ID provided');

      return {
        message: 'Custom category successfully updated',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Receive a contact us email from users
  async contactUs(
    contactUsInput: ContactUsInput,
  ): Promise<{ message: string }> {
    try {
      await this.mailService.emailContactUs(contactUsInput);

      return {
        message:
          'Your message was sent successfully. We will contact you soon. Thank you for your feedback',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get day diffrences
  dayDifference(lastPlay: Date, today: Date): number {
    try {
      // Calculate the difference in milliseconds
      const diffMilliseconds = Math.abs(today.getTime() - lastPlay.getTime());

      // Convert milliseconds to days
      const millisecondsInDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.floor(diffMilliseconds / millisecondsInDay);

      return diffDays;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update user's streaks
  async updateUser(
    user: UserDocument,
    isUpdateStreaks?: boolean,
  ): Promise<void> {
    try {
      if (isUpdateStreaks) {
        const today = new Date();

        if (!user?.playQuizAtDay) {
          user.quizzer.dailyStreak++;
          user.quizzer.weeklyStreak++;

          user.playQuizAtDay = today;
          user.playQuizAtWeek = today;
        } else {
          const dayDifference = this.dayDifference(user?.playQuizAtDay, today);
          const weekDifference = this.dayDifference(
            user?.playQuizAtWeek,
            today,
          );

          switch (dayDifference) {
            case 0:
              break;

            case 1:
              user.quizzer.dailyStreak++;
              user.playQuizAtDay = new Date();
              break;

            default:
              user.quizzer.dailyStreak = 1;
              user.playQuizAtDay = new Date();
              break;
          }

          switch (true) {
            case weekDifference < 7:
              break;

            case weekDifference >= 7 && weekDifference < 14:
              user.quizzer.weeklyStreak++;
              user.playQuizAtWeek = new Date();
              break;

            default:
              user.quizzer.weeklyStreak = 1;
              user.playQuizAtWeek = new Date();
              break;
          }
        }

        // Mark quizzer and subscription fields as modified
        user.markModified('quizzer');
        await user.save();
      }

      const tokenBalance = user?.subscription?.tokenBalance || 0;

      this.eventEmitter.emit(eventEmitterType.GET_USER_UPDATE, user.userUUID, {
        dailyStreak: user?.quizzer?.dailyStreak,
        weeklyStreak: user?.quizzer?.weeklyStreak,
        tokenBalance: tokenBalance,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Reset user's streaks
  async resetStreaks(user: UserDocument): Promise<void> {
    try {
      const today = new Date();

      if (user?.playQuizAtDay) {
        const dayDifference = this.dayDifference(user?.playQuizAtDay, today);
        const weekDifference = this.dayDifference(user?.playQuizAtWeek, today);

        switch (dayDifference) {
          case 0:
          case 1:
            break;

          default:
            user.quizzer.dailyStreak = 0;
            break;
        }

        switch (true) {
          case weekDifference < 7:
          case weekDifference >= 7 && weekDifference < 14:
            break;

          default:
            user.quizzer.weeklyStreak = 0;
            break;
        }
      }

      // Mark quizzer and subscription fields as modified
      user.markModified('quizzer');

      const tokenBalance = user?.subscription?.tokenBalance || 0;

      this.eventEmitter.emit(eventEmitterType.GET_USER_UPDATE, user.userUUID, {
        dailyStreak: user?.quizzer?.dailyStreak,
        weeklyStreak: user?.quizzer?.weeklyStreak,
        tokenBalance: tokenBalance,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Deduct user's tokens
  async deductCredit(
    user: UserDocument,
    tokenUsed: number,
    isSlide?: boolean,
    isClinEx?: boolean,
  ) {
    try {
      // Determine the correct subscription source
      const subscription = isSlide
        ? user?.slideSub
        : isClinEx
        ? user?.clinExSub
        : user?.subscription;

      if (!subscription) {
        throw new BadRequestException('Subscription not found');
      }

      let { topUpCredits = 0, subCredits = 0 } = subscription;

      if (subCredits >= tokenUsed) {
        subCredits -= tokenUsed;
      } else if (topUpCredits >= tokenUsed) {
        topUpCredits -= tokenUsed;
      } else if (topUpCredits + subCredits >= tokenUsed) {
        const remaining = topUpCredits + subCredits - tokenUsed;
        subCredits = remaining > 0 ? remaining : 0;
        topUpCredits = 0;
      } else {
        // Not enough credits
        subCredits = 0;
        topUpCredits = 0;
      }

      // Update subscription state
      subscription.subCredits = subCredits;
      subscription.topUpCredits = topUpCredits;
      subscription.tokenBalance = subCredits + topUpCredits;

      // Mark field as modified for Mongoose to detect changes
      user.markModified(
        isSlide ? 'slideSub' : isClinEx ? 'clinExSub' : 'subscription',
      );

      await user.save();

      this.eventEmitter.emit(
        eventEmitterType.SUBSCRIPTION_UPDATE,
        user.userUUID,
        {
          subscription,
        },
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update user's active hours
  async updateActiveHours(
    userUUID: string,
    disconnectAt: Date,
    connectedAt: Date,
  ): Promise<void> {
    try {
      const user = await this.getUserByUUID(userUUID);

      const currentHours = user?.quizzer?.cumulativeHours || '00:00:00';

      // Calculate the difference between connectedAt and disconnectAt
      const diffInSeconds =
        Math.abs(disconnectAt.getTime() - connectedAt.getTime()) / 1000;

      // Format the difference to hh:mm:ss
      const hoursDiff = Math.floor(diffInSeconds / 3600);
      const minutesDiff = Math.floor((diffInSeconds % 3600) / 60);
      const secondsDiff = Math.floor(diffInSeconds % 60);

      const [hours1, minutes1, seconds1] = currentHours.split(':').map(Number);

      // Calculate total seconds
      let totalSeconds =
        hoursDiff * 3600 +
        minutesDiff * 60 +
        secondsDiff +
        (hours1 * 3600 + minutes1 * 60 + seconds1);

      // Calculate sum of hours, minutes and seconds
      const sumHours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      const minutesSum = Math.floor(totalSeconds / 60);
      const secondsSum = totalSeconds % 60;

      // Format the sum of hours, minutes, and seconds into hh:mm:ss
      const cumulativeHours = `${String(sumHours).padStart(2, '0')}:${String(
        minutesSum,
      ).padStart(2, '0')}:${String(secondsSum).padStart(2, '0')}`;

      // Get the number of days since signup
      const daysInApp = Math.max(
        this.dayDifference(new Date(), user.createdAt),
        1,
      );

      // Calculate daily average activity
      const [hours, minutes, seconds] = cumulativeHours.split(':').map(Number);
      const averageDailyHoursInSeconds =
        (hours * 3600 + minutes * 60 + seconds) / daysInApp;

      const averageHours = Math.floor(averageDailyHoursInSeconds / 3600);
      const avgMinutes = Math.floor((averageDailyHoursInSeconds % 3600) / 60);
      const avgSeconds = Math.floor(averageDailyHoursInSeconds % 60);

      const dailyAverage = `${String(averageHours).padStart(2, '0')}:${String(
        avgMinutes,
      ).padStart(2, '0')}:${String(avgSeconds).padStart(2, '0')}`;

      user.quizzer.cumulativeHours =
        cumulativeHours || user?.quizzer?.cumulativeHours;
      user.quizzer.dailyAverage = dailyAverage || user?.quizzer?.dailyAverage;

      // Calculate percentage of dailyAverage in cumulativeHours
      const cumulativeHoursInSeconds =
        sumHours * 3600 + minutesSum * 60 + secondsSum;
      const dailyAverageInSeconds =
        averageHours * 3600 + avgMinutes * 60 + avgSeconds;

      const dailyAveragePercentage = +(
        (dailyAverageInSeconds / cumulativeHoursInSeconds) *
        100
      ).toFixed(2);

      user.quizzer.perceDailyAve =
        dailyAveragePercentage || user.quizzer.perceDailyAve;

      // Mark quizzer field as modified
      user.markModified('quizzer');
      await user.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Testing update daily and weekly streaks
  async tesingStreaks(user: UserDocument) {
    try {
      await this.updateUser(user);

      return {
        message: 'Daily and weekly streak sent.',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Demo credit user
  async demoCreditUser(email: string, amount: number, app?: AppType) {
    try {
      const user = await this.getUserByEmail(email);

      if (app === AppType.MEDSCROLL_SLIDE) {
        user.slideSub.topUpCredits += amount;
        user.slideSub.tokenBalance =
          user.slideSub.topUpCredits + user.slideSub.subCredits;
      } else {
        user.subscription.topUpCredits += amount;
        user.subscription.tokenBalance =
          user.subscription.topUpCredits + user.subscription.subCredits;
      }

      user.markModified(
        app === AppType.MEDSCROLL_SLIDE ? 'slideSub' : 'subscription',
      );
      await user.save();

      return {
        data: {
          subscription: user.subscription,
          slideSub: user.slideSub,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get UUID
  getUUID() {
    return { data: { uuid: uuidv4() } };
  }

  /****
   *  Test event generation
   *  @param user
   *  @returns
   * ****/
  async demoTriggerEvent(user: UserDocument, event: ComponentType) {
    try {
      switch (event) {
        case ComponentType.GENERATE_PODCAST:
          this.eventEmitter.emit(
            eventEmitterType.PODCAST_GENERATED,
            user.userUUID,
            {
              fileUrl:
                'https://d1p9fc0i566fiv.cloudfront.net/medscroll-dev-images/chat-simulation/episode/99da2489b083177d988f14600511f0daccea21a32a7e05976fce82c01376b4c0.mp3',
              simulationUUID: 'a5750efc-b9a2-4b0f-8f86-b061a456b4ee',
              eventName: 'Anatomy Roundtable',
            },
          );
          break;

        case ComponentType.CLINICAL_EXAMS:
          this.eventEmitter.emit(
            eventEmitterType.SUBSCRIPTION_UPDATE,
            user.userUUID,
            {
              subscription: user?.clinExSub,
            },
          );
          break;

        default:
          throw new BadRequestException('Invalid event type');
      }

      return {
        message: 'Event triggered successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
