import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import {
  Current,
  Engagement,
  MedscrollQues,
  PresQuestionScore,
  Score,
  TotalRes,
} from './type.entity';
import { GameStateType } from '../enum/quiz.enum';
import { PresentationEntity } from 'src/presentation/entity/presentation.entity';
import { TooManyOriginRequestPolicies } from '@aws-sdk/client-cloudfront';

@Schema(mongooseSchemaConfig)
export class GameEntity {
  @Prop({ type: String, default: uuidv4 })
  gameUUID?: string;

  @Prop({ type: Types.ObjectId, ref: PresentationEntity.name, default: null })
  presId?: Types.ObjectId;

  @Prop()
  creatorUUID: string;

  @Prop()
  playersUUIDs: string[];

  @Prop({
    type: Map,
    of: new mongoose.Schema({
      userUUID: { type: String, required: true },
      firstName: { type: String, required: true },
      plan: { type: String },
      url: { type: String },
      speed: { type: Number, required: true },
      speedBonus: { type: Number, required: true },
      score: { type: Number, required: true },
      correct: { type: Number, required: true },
      incorrect: { type: Number, required: true },
    }),
  })
  playerScores: Map<string, Score>;

  @Prop({ type: [PresQuestionScore], default: null })
  presScores?: PresQuestionScore[];

  @Prop({
    type: Map,
    of: new mongoose.Schema({
      totalRes: { type: Number, required: true },
    }),
    default: null,
  })
  responses: Map<string, TotalRes>;

  @Prop({ default: null })
  inviteCode: string;

  @Prop()
  questionUUIDs?: string[];

  @Prop({ default: null })
  presEngagement?: Engagement[];

  @Prop({ default: null })
  topic?: string;

  @Prop({ default: null })
  totalQuestion?: number;

  @Prop({ default: false })
  isCDStart?: boolean; // Indicate whether the countdown has started or not?

  @Prop({ default: null })
  maxPlayers?: number;

  @Prop({ default: 0 })
  answeredQuestion?: number;

  @Prop({ default: null })
  currentSlide: Current;

  @Prop({
    type: String,
    default: GameStateType.NOT_STARTED,
    enum: GameStateType,
  })
  gameState?: GameStateType;

  @Prop({ default: { status: false, subcategory: [] } })
  isMedQues?: MedscrollQues;
}

export const GameSchema = SchemaFactory.createForClass(GameEntity);

export type GameDocument = GameEntity & Document;
