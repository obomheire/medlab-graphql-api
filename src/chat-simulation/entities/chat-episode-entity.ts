import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import {
  ConvertSimulationType,
  PrivateChatType,
  QAndAType,
} from './types.entity';
import { SimulationPoll, SimulationQuiz } from '../types/chat.types';
import { EpisodeStatus, ScheduleType } from '../enums/chat-simuation.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatEpisodeEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  episodeUUID: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  episodeTitle: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  description: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  fileUrl: string; // 'The url of the uploaded episode audio file',

  @Field(() => Boolean, { nullable: true })
  @Prop({ type: Boolean, default: false })
  isUploaded: boolean;

  @Field(() => String)
  @Prop({ type: String })
  eventName: string;

  @Field(() => [String], { nullable: true })
  @Prop({ type: [String] })
  episodeTopics: string[];

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  episodeOutline: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  threadId?: string;

  @Field(() => String, { nullable: true }) // Episode number
  @Prop({ type: String })
  episode: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  joinCode: string;

  @Field(() => String)
  @Prop({ type: String })
  simulation: string;

  @Field(() => [ConvertSimulationType], { nullable: true })
  @Prop({ type: [ConvertSimulationType], default: [] })
  userSimulation: ConvertSimulationType[];

  @Field(() => [ConvertSimulationType], { nullable: true })
  @Prop({ type: [ConvertSimulationType], default: [] })
  completedSimulation: ConvertSimulationType[];

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  @Prop({ type: Number, default: 0 })
  noOfViews: number;

  @Field(() => [SimulationQuiz], { nullable: true })
  @Prop({ type: [SimulationQuiz] })
  quiz: SimulationQuiz[];

  @Field(() => [SimulationPoll], { nullable: true })
  @Prop({ type: [SimulationPoll] })
  poll: SimulationPoll[];

  @Field(() => [QAndAType], { nullable: true })
  @Prop({ type: [QAndAType] })
  qa: QAndAType[];

  @Field(() => [QAndAType], { nullable: true })
  @Prop({ type: [QAndAType] })
  comments: QAndAType[];

  @Field(() => [PrivateChatType], { nullable: true })
  @Prop({ type: [PrivateChatType] })
  privateChat: PrivateChatType[];

  @Field(() => String, { defaultValue: EpisodeStatus?.QUEUED })
  @Prop({ type: String, enum: EpisodeStatus, default: EpisodeStatus?.QUEUED })
  status: EpisodeStatus;

  @Field(() => Date)
  @Prop({ type: Date })
  scheduled: Date;

  @Field(() => String, { defaultValue: ScheduleType.DAILY })
  @Prop({ type: String, enum: ScheduleType, default: ScheduleType.DAILY })
  scheduledType: ScheduleType;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null }) // Duration in seconds to the whole number
  duration: number;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null }) // Size in bytes
  audioSize: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null }) // Word count
  eventCoverImage: string;
}

export const ChatEpisodeSchema =
  SchemaFactory.createForClass(ChatEpisodeEntity);

export type ChatEpisodeDocument = ChatEpisodeEntity & Document;

@ObjectType()
export class ChatEpisodeWithProgress extends ChatEpisodeEntity {
  @Field(() => Number)
  progress: number;
}
