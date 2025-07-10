import { forwardRef, Module } from '@nestjs/common';
import { ClinicalExamService } from './service/clinicalExam.service';
import { ClinicalExamResolver } from './resolver/clinicalExam.resolver';
import { ClinicalExamEntity } from './entity/clinicalExams.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicalExamSchema } from './entity/clinicalExams.entity';
import { FaqService } from './service/faq.service';
import { FaqResolver } from './resolver/faq.resolver';
import { FaqSchema } from './entity/faq.entity';
import { FaqEntity } from './entity/faq.entity';
import { PractCaseSchema } from './entity/practCase.entity';
import {
  PractCaseCatEntity,
  CaseCategorySchema,
} from './entity/practCaseCat.entity';
import { PractCaseEntity } from './entity/practCase.entity';
import { PractCaseService } from './service/practCase.serveice';
import { PractCaseResolver } from './resolver/practCase.resolver';
import { PracticeCaseCatResolver } from './resolver/practCaseCat.resolver';
import { PractCaseCatService } from './service/practCaseCat.service';
import { GradeEntity } from './entity/grade.entity';
import { GradeSchema } from './entity/grade.entity';
import {
  ClinicalExamTutorialEntity,
  ClinicalExamTutorialSchema,
} from './entity/clinicalExams.tutorial.entity';
import { ClinicalExamTutorialResolver } from './resolver/clinicalExams.tutorial.resolver';
import { ClinicalExamTutorialService } from './service/clinicalExams.tutorial.service';
import { ConversationEntity } from './entity/conversation.entity';
import { ConversationSchema } from './entity/conversation.entity';
import { ConversationService } from './service/conversation.service';
import { ConversationResolver } from './resolver/conversation.resolver';
import { QuizModule } from 'src/quiz/quiz.module';
import { TemplateEntity, TemplateSchema } from './entity/template.entity';
import { TemplateResolver } from './resolver/template.resolver';
import { TemplateService } from './service/template.service';
import { HttpModule } from '@nestjs/axios';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { ElevenlabsModule } from 'src/llm-providers/elevenlabs/elevenlabs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ClinicalExamEntity.name,
        schema: ClinicalExamSchema,
      },
      {
        name: FaqEntity.name,
        schema: FaqSchema,
      },
      {
        name: PractCaseEntity.name,
        schema: PractCaseSchema,
      },
      {
        name: PractCaseCatEntity.name,
        schema: CaseCategorySchema,
      },
      {
        name: GradeEntity.name,
        schema: GradeSchema,
      },
      {
        name: ClinicalExamTutorialEntity.name,
        schema: ClinicalExamTutorialSchema,
      },
      {
        name: ConversationEntity.name,
        schema: ConversationSchema,
      },
      {
        name: TemplateEntity.name,
        schema: TemplateSchema,
      },
    ]),
    forwardRef(() => QuizModule),
    HttpModule,
    forwardRef(() => OpenAIModule),
    ElevenlabsModule,
  ],

  providers: [
    ClinicalExamResolver,
    ClinicalExamService,
    FaqResolver,
    FaqService,
    PractCaseResolver,
    PractCaseService,
    PracticeCaseCatResolver,
    PractCaseCatService,
    ClinicalExamTutorialResolver,
    ClinicalExamTutorialService,
    ConversationResolver,
    ConversationService,
    TemplateResolver,
    TemplateService,
    AwsS3Service,
  ],
  exports: [PractCaseCatService, ConversationService],
})
export class ClinicalExamModule {}
