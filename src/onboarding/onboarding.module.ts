import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserSettingEntity,
  UserSettingSchema,
} from './entity/userSetting.entity';
import { OnboardingResolver } from './resolver/onboarding.resolver';
import { OnboardingService } from './service/onboarding.service';
import { UserEntity, UserSchema } from 'src/user/entity/user.entity';
import { UserModule } from 'src/user/user.module';
import { QuizModule } from 'src/quiz/quiz.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: UserSettingEntity.name,
        useFactory: () => {
          return UserSettingSchema;
        },
      },
      {
        name: UserEntity.name,
        useFactory: () => {
          return UserSchema;
        },
      },
    ]),
    UserModule,
    QuizModule,
  ],
  controllers: [],
  providers: [OnboardingResolver, OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
