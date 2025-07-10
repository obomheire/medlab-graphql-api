import { forwardRef, Module } from '@nestjs/common';
import { QuizAIService } from './service/ai.quiz.service';
import { QuizAIResolver } from './resolver/ai.quiz.resolver';
import { ChatHistoryService } from './service/ai.quiz.history';
import { HttpModule } from '@nestjs/axios';
import { AssistantAIResolver } from './resolver/ai.assistant.resolver';
import { AIasistantService } from './service/ai.assistant.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AsstThreadService } from './service/ai.thread.service';
import { AsstThreadResolver } from './resolver/ai.thread.resolver';
import { ThreadGrpEntity, ThreadGrpSchema } from './entity/threadGrp.entity';
import { DriveModule } from 'src/drive/drive.module';
import { QuizModule } from 'src/quiz/quiz.module';
import { ClinicalExamAIResolver } from './resolver/ai.clinicalExam.resolver';
import { ClinicalExamAIService } from './service/ai.clinicalExam.service';
import { SpeechAIService } from './service/ai.speech.service';
import { ClinicalExamModule } from 'src/clinicalExam/clinicalExam.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    HttpModule,
    DriveModule,
    ClinicalExamModule,
    forwardRef(() => QuizModule),
    UserModule,
    MongooseModule.forFeatureAsync([
      {
        name: ThreadGrpEntity.name,
        useFactory: () => {
          return ThreadGrpSchema;
        },
      },
    ]),
  ],
  providers: [
    QuizAIResolver,
    QuizAIService,
    ChatHistoryService,
    AssistantAIResolver,
    AIasistantService,
    AsstThreadResolver,
    AsstThreadService,
    ClinicalExamAIResolver,
    ClinicalExamAIService,
    SpeechAIService,
  ],
  exports: [
    ChatHistoryService,
    QuizAIService,
    AsstThreadService,
    AIasistantService,
    SpeechAIService,
  ],
})
export class OpenAIModule {}
