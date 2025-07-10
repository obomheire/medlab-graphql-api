import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { AICharacterEntityType, ConvertSimulationType } from './types.entity';
import { SimulationPoll, SimulationQuiz } from '../types/chat.types';
import { EpisodeStatus, ScheduleType } from '../enums/chat-simuation.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatSimulationEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  simulationUUID: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  episodeTitle: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  description: string;

  @Field(() => String, {
    description: 'this is the episode name. Example, episode 1',
  })
  @Prop({ type: String })
  episode: string;

  @Field(() => Number)
  @Prop({ type: Number })
  noOfEpisodes: number;

  @Field(() => [String], { nullable: true })
  @Prop({ type: [String] })
  episodeTopics: string[];

  @Field(() => String)
  @Prop({ type: String })
  eventName: string;

  @Field(() => String)
  @Prop({ type: String })
  category: string;

  @Field(() => String)
  @Prop({ type: String })
  channelName: string;

  @Field(() => String)
  @Prop({ type: String })
  channelDescription: string;

  @Field(() => String)
  @Prop({ type: String })
  eventDescription: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  episodeDescription: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  fileUrl: string;

  @Field(() => Boolean, { nullable: true })
  @Prop({ type: Boolean, default: false })
  isUploaded: boolean;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  status: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, enum: EpisodeStatus, default: null })
  genPodStatus: EpisodeStatus;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  eventTemplate?: string;

  @Field(() => Number)
  @Prop({ type: Number })
  actorCount: number;

  @Field(() => Number)
  @Prop({ type: Number })
  noOfQuestions: number;

  @Field(() => [AICharacterEntityType])
  @Prop({ type: [AICharacterEntityType] })
  characterDetails: AICharacterEntityType[];

  @Field(() => String)
  @Prop({ type: String })
  quizType: string;

  @Field(() => String)
  @Prop({ type: String })
  pollType: string;

  @Field(() => String)
  @Prop({ type: String })
  threadId: string;

  @Field(() => String)
  @Prop({ type: String })
  simulation: string;

  @Field(() => [ConvertSimulationType], { nullable: true })
  @Prop({ type: [ConvertSimulationType], default: [] })
  userSimulation: ConvertSimulationType[];

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  masterOutline: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  episodeOutline: string;

  @Field(() => Date, { nullable: true })
  @Prop({ type: Date })
  scheduled: Date;

  @Field(() => String, { defaultValue: ScheduleType.DAILY, nullable: true })
  @Prop({ type: String, enum: ScheduleType, default: ScheduleType.DAILY })
  scheduledType: ScheduleType;

  @Field(() => [SimulationQuiz], { nullable: true })
  @Prop({ type: [SimulationQuiz] })
  quiz: SimulationQuiz[];

  @Field(() => [SimulationPoll], { nullable: true })
  @Prop({ type: [SimulationPoll] })
  poll: SimulationPoll[];

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null }) // Duration in seconds to the whole number
  duration: number;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null }) // Size in bytes
  audioSize: number;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null }) // Word count
  eventCoverImage: string;
}

export const ChatSimulationSchema =
  SchemaFactory.createForClass(ChatSimulationEntity);

export type ChatSimulationDocument = ChatSimulationEntity & Document;
