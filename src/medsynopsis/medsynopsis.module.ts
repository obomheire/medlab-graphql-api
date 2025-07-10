/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MedSynopsisCategoryEntity,
  MedSynopsisCategorySchema,
} from './entity/medsynopsisCatergory.entity';
import {
  MedSynopsisUserScoreEntity,
  MedSynopsisUserScoreSchema,
} from './entity/medsynopsisUserScore.entity';
import { MedSynopsisAIService } from './service/medsynopsisAI.service';
import { MedSynopsisResolver } from './resolver/medsynopsis.resolver';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { HttpModule } from '@nestjs/axios';
import {
  MedSynopsisCaseEntity,
  MedSynopsisCaseSchema,
} from './entity/medsynopsisCase.entity';
import { MedSynopsisService } from './service/medsynopsis.service';
import {
  MedSynopsisUserCaseEntity,
  MedSynopsisUserCaseSchema,
} from './entity/medsynopsisUserCase.entity';
import { ChatHistoryService } from 'src/llm-providers/openAI/service/ai.quiz.history';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeatureAsync([
      {
        name: MedSynopsisCaseEntity.name,
        useFactory: () => {
          return MedSynopsisCaseSchema;
        },
      },
      {
        name: MedSynopsisCategoryEntity.name,
        useFactory: () => {
          return MedSynopsisCategorySchema;
        },
      },
      {
        name: MedSynopsisUserScoreEntity.name,
        useFactory: () => {
          return MedSynopsisUserScoreSchema;
        },
      },
      {
        name: MedSynopsisUserCaseEntity.name,
        useFactory: () => {
          return MedSynopsisUserCaseSchema;
        },
      },
    ]),
    OpenAIModule,
  ],
  providers: [
    MedSynopsisService,
    AwsS3Service,
    ChatHistoryService,
    MedSynopsisAIService,
    MedSynopsisResolver,
  ],
  exports: [MedSynopsisService],
})
export class MedSynopsisModule {}
