import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import {
  QuestionEntity,
  QuestionSchema,
} from 'src/quiz/entity/questions.entity';
import { InsertQuestionService } from './insertQuestions';
import { QuizModule } from 'src/quiz/quiz.module';
import { ContactUsersService } from './contactUsers';
import { MailModule } from 'src/mail/mail.module';
import { DeleteUserService } from './deleteUser.task';
import { InsertPositionService } from './insertPosition';
import { DeleteGameService } from './deleteGame.task';
import { UpdateUsersService } from './updateUsers';
import { DeleteVSservice } from './deleteVS.task';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { LeaderboardSeederService } from './leaderboardSeeder';
import { MedSynopsisModule } from 'src/medsynopsis/medsynopsis.module';
import { DriveModule } from 'src/drive/drive.module';
import { PresentationModule } from 'src/presentation/presentation.module';
import { OnboardingModule } from 'src/onboarding/onboarding.module';
import { ExamPrepModule } from 'src/exam-prep/exam-prep.module';
import { UpdatePatientProfileService } from './updatePatientProfile';
import {
  CaseCategorySchema,
  PractCaseCatEntity,
} from 'src/clinicalExam/entity/practCaseCat.entity';
import { ClinExReportService } from './clinExReport.task';
import { UtilitiesModule } from 'src/utilities/utilities.module';
import { DeleteTempFilesService } from './deleteTempFiles.task';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeatureAsync([
      {
        name: QuestionEntity.name,
        useFactory: () => {
          return QuestionSchema;
        },
      },
      {
        name: PractCaseCatEntity.name,
        useFactory: () => {
          return CaseCategorySchema;
        },
      },
    ]),
    QuizModule,
    MailModule,
    OpenAIModule,
    MedSynopsisModule,
    DriveModule,
    PresentationModule,
    OnboardingModule,
    ExamPrepModule,
    UtilitiesModule,
  ],
  providers: [
    InsertQuestionService,
    ContactUsersService,
    DeleteUserService,
    InsertPositionService,
    DeleteGameService,
    UpdateUsersService,
    DeleteVSservice,
    LeaderboardSeederService,
    UpdatePatientProfileService,
    ClinExReportService,
    DeleteTempFilesService,
  ],
})
export class ScheduleTaskModule {}
