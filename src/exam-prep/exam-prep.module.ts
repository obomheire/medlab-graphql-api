import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import {
  ExamPrepConfigEntity,
  ExamPrepConfigSchema,
} from './entity/exam-prep.config.entity';
import { ExamPrepService } from './service/exam-prep.service';
import { ExamPrepResolver } from './resolver/exam-prep.resolver';
import { HttpModule } from '@nestjs/axios';
import {
  LearningPathEntity,
  LearningPathSchema,
} from './entity/learningPath.entity';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeatureAsync([
      {
        name: LearningPathEntity.name,
        useFactory: () => {
          return LearningPathSchema;
        },
      },
      {
        name: ExamPrepConfigEntity.name,
        useFactory: () => {
          return ExamPrepConfigSchema;
        },
      },
    ]),
    OpenAIModule,
  ],
  providers: [ExamPrepService, ExamPrepResolver],
  exports: [ExamPrepService],
})
export class ExamPrepModule {}
