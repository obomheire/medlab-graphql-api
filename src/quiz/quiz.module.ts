import { Module } from '@nestjs/common';
import { QuestionService } from './service/question.service';
import { QuestionResolver } from './resolver/question.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionEntity, QuestionSchema } from './entity/questions.entity';
import { AuthModule } from 'src/auth/auth.module';
import { QuizEntity, QuizSchema } from './entity/quiz.entity';
import { QuizService } from './service/quiz.service';
import { QuizResolver } from './resolver/quiz.resolver';
import { GameEntity, GameSchema } from './entity/game.entity';
import { GameService } from './service/game.service';
import { GameResolver } from './resolver/game.resolver';
import { CaseEntity, CaseSchema } from './entity/case.entity';
import { CaseService } from './service/case.service';
import { CaseResolver } from './resolver/case.resolver';
import { BullModule } from '@nestjs/bull';
import { QUESTION_QUEUE } from 'src/utilities/constant/queue.constant';
import { CaseQuestionConsumer } from './service/question.consumers';
import { OpenAIModule } from 'src/llm-providers/openAI/openAI.module';
import { QuizProcessor } from 'src/utilities/service/queue/dxQuest.process';
import { QuizQueueService } from 'src/utilities/service/queue/queue.service';
import { LeaderBoardService } from './service/leaderboard.service';
import {
  LeaderboardEntity,
  LeaderboardSchema,
} from 'src/user/entity/leaderboard.entity';
import { LeaderBoardResolver } from './resolver/leaderboard.resolver';
import { FeaturedEntity, FeaturedSchema } from './entity/featured.entity';
import { FeaturedService } from './service/featured.service';
import { FeaturedResolver } from './resolver/featured.resolver';
import { UserEntity, UserSchema } from 'src/user/entity/user.entity';
import {
  UserQuizScoreEntity,
  UserQuizScoreSchema,
} from './entity/userQuizScoreEntity';
import { SaveUserQuizScoreService } from './service/saveUserQuizScore.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: QuestionEntity.name,
        useFactory: () => {
          return QuestionSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: LeaderboardEntity.name,
        useFactory: () => {
          return LeaderboardSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: QuizEntity.name,
        useFactory: () => {
          return QuizSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: FeaturedEntity.name,
        useFactory: () => {
          return FeaturedSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: GameEntity.name,
        useFactory: () => {
          return GameSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: UserEntity.name,
        useFactory: () => {
          return UserSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: CaseEntity.name,
        useFactory: () => {
          return CaseSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: UserQuizScoreEntity.name,
        useFactory: () => {
          return UserQuizScoreSchema;
        },
      },
    ]),
    AuthModule,
    OpenAIModule,
    BullModule.registerQueue({
      name: QUESTION_QUEUE,
    }),
    BullModule.registerQueue({
      name: 'quiz',
    }),
  ],
  providers: [
    QuestionResolver,
    QuizResolver,
    GameResolver,
    CaseResolver,
    QuestionService,
    QuizService,
    GameService,
    CaseService,
    CaseQuestionConsumer,
    QuizProcessor,
    QuizQueueService,
    LeaderBoardResolver,
    LeaderBoardService,
    FeaturedResolver,
    FeaturedService,
    SaveUserQuizScoreService,
  ],
  exports: [
    QuestionService,
    QuizQueueService,
    QuizProcessor,
    QuizService,
    GameService,
    CaseService,
    LeaderBoardService,
    SaveUserQuizScoreService,
  ],
})
export class QuizModule {}
