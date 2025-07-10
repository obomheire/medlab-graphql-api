import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { DriveService } from 'src/drive/service/drive.service';
import { ExamPrepService } from 'src/exam-prep/service/exam-prep.service';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { MedSynopsisService } from 'src/medsynopsis/service/medsynopsis.service';
import { OnboardingService } from 'src/onboarding/service/onboarding.service';
import { PresentationService } from 'src/presentation/service/presentation.service';
import { LeaderBoardService } from 'src/quiz/service/leaderboard.service';
import { QuizService } from 'src/quiz/service/quiz.service';
import { UserService } from 'src/user/service/user.service';

@Injectable()
export class DeleteUserService {
  private readonly logger = new Logger(DeleteUserService.name);

  constructor(
    private readonly userService: UserService,
    private readonly quizService: QuizService,
    private readonly leaderBoardService: LeaderBoardService,
    private readonly awsS3Service: AwsS3Service,
    @Inject(forwardRef(() => MedSynopsisService))
    private readonly medSynopsisService: MedSynopsisService,
    private readonly asstThreadService: AsstThreadService,
    private readonly driveService: DriveService,
    private readonly presentationService: PresentationService,
    private readonly onboardingService: OnboardingService,
    private readonly examPrepService: ExamPrepService,
  ) {
    this.logger.log('DeleteUserService instantiated');
  }

  // Shedule a cron task that will run 12 mid-night everyday and check the dateDeactivated field in the user entity if it is 14 day old. if it is, delete the record from the database
  // @Cron('38 8  * * *') // run the cron @ 03: 04 pm
  @Cron('0 0 * * 6') // Runs at: Midnight (00:00) every Saturday
  async deleteUser() {
    this.logger.log('Cron job started');
    try {
      const users = await this.userService.getUsersToDelete();

      this.logger.log(`Found ${users.length} users to delete`);

      const deleteUsers = users.map(async (user) => {
        // Delete all user's quiz and questions
        const { questionCount, quizCount } =
          await this.quizService.deleteQuizzes(user._id);

        this.logger.log(
          `Deleted ${questionCount} questions and ${quizCount} quizzes`,
        );

        // Delete user's records from leaderboard
        const board = await this.leaderBoardService.deleteUserRecords(user._id);

        this.logger.log(`Deleted ${board?.count} records from leaderboard`);

        // Delete all user medsynopsys case by user UUID
        const caseCount = await this.medSynopsisService.deleteAllMedsUserCase(
          user.userUUID,
        );

        this.logger.log(`Deleted ${caseCount?.count} user medsynopsys cases  `);

        // Delete all user medsynopsys score by user UUID
        const scoreCount = await this.medSynopsisService.deleteAllMedsUserScore(
          user.userUUID,
        );

        this.logger.log(`Deleted ${scoreCount?.count} user medsynopsys score`);

        // Delete all user medsynopsys score by user UUID
        const learningPath = await this.examPrepService.deleteUserLearningPath(
          user.userUUID,
        );

        this.logger.log(`Deleted ${learningPath?.count} user learning path`); // deleteUserLearningPath

        // Delete user's exam prep
        const examPrep = await this.examPrepService.deleteUserExamPrep(
          user.userUUID,
        );

        this.logger.log(`Deleted ${examPrep?.count} user exam prep`);

        // Delete all user thread group
        const threadGrpCount =
          await this.asstThreadService.deleteAllUserThreads(user._id);

        this.logger.log(`Deleted ${threadGrpCount?.count} user threads  `);

        // Delete all user drive
        const drive = await this.driveService.deleteAllUserDrive(user._id);

        this.logger.log(`Deleted ${drive?.count} user drive  `);

        // Delete all user presentation
        const pres = await this.presentationService.deleteAllUserPres(user._id);

        this.logger.log(`Deleted ${pres?.count} user presentations  `);

        // Delete all user setings
        const settings = await this.onboardingService.deleteAllUserSettings(
          user._id,
        );

        this.logger.log(`Deleted ${settings?.count} user settings  `);

        // Delete the user's profileImage from from AWS S3 bucket
        if (user?.profileImage) {
          await this.awsS3Service.deleteFiles([user.profileImage]);
        }

        // Delete user
        return await user.deleteOne();
      });

      const result = await Promise.all(deleteUsers);

      this.logger.log(`Deleted ${result.length} user/users`);
      this.logger.log('Cron job completed successfully');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
