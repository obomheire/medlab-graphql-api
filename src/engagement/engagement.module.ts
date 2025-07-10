import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EngagementService } from './service/engagement.service';
import { EngagementSchema } from 'src/quiz/entity/engagement.entity';
import { EngagementEntity } from 'src/quiz/entity/engagement.entity';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { UserModule } from 'src/user/user.module';
import {
  ThreadGrpEntity,
  ThreadGrpSchema,
} from 'src/llm-providers/openAI/entity/threadGrp.entity';
import { HttpModule } from '@nestjs/axios';
import { UserEntity, UserSchema } from 'src/user/entity/user.entity';
import { DriveModule } from 'src/drive/drive.module';
import { DriveEntity, DriveSchema } from 'src/drive/entity/drive.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: EngagementEntity.name,
        useFactory: () => {
          return EngagementSchema;
        },
      },
      {
        name: ThreadGrpEntity.name,
        useFactory: () => {
          return ThreadGrpSchema;
        },
      },
      {
        name: UserEntity.name,
        useFactory: () => {
          return UserSchema;
        },
      },
      {
        name: DriveEntity.name,
        useFactory: () => {
          return DriveSchema;
        },
      },
    ]),
    OpenAIModule,
    UserModule,
    HttpModule,
    DriveModule,
  ],
  providers: [
    AsstThreadService,
    EngagementService,
    // UserService,
  ],
  exports: [EngagementService],
})
export class EngagementModule {}
