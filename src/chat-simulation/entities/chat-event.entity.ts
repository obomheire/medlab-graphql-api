import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { ChatEpisodeEntity } from './chat-episode-entity';
import { v4 as uuidv4 } from 'uuid';
import { ScheduleType } from '../enums/chat-simuation.enum';
import { AICharacterEntityType } from './types.entity';
import { defaultImages } from '../constants/data.constant';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatEventEntity {
  @Field(() => String, { nullable: true })
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: uuidv4 })
  eventUUID: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  description: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  masterOutline: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  eventTemplateUrl: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  masterOutlineThreadId?: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  eventTemplateContent: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  channelName: string;

  @Field(() => Date, { nullable: true })
  @Prop({ type: Date, default: null })
  scheduled: Date;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: '00:30' }) // Default to 30 minutes long (5100 word count, 220wpm )
  duration: string;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: 6600 }) // Default to 6600 word count (30 minutes long, 220wpm)
  wordCount: number;

  @Field(() => String, { nullable: true, defaultValue: ScheduleType.DAILY })
  @Prop({ type: String, enum: ScheduleType, default: ScheduleType.DAILY })
  scheduledType: ScheduleType;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    default: defaultImages.defaultEventImage,
  })
  coverImage: string;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  noOfPanelist: number;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  noOfActors: number;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop({ type: Boolean, default: false })
  draft: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop({ type: Boolean, default: false })
  quiz: boolean;

  @Field(() => String, { nullable: true, defaultValue: 'MULTICHOICE' })
  @Prop({ type: String, default: 'MULTICHOICE' })
  quizType: string;

  @Field(() => String, { nullable: true, defaultValue: 'MULTICHOICE' })
  @Prop({ type: String, default: 'MULTICHOICE' })
  pollType: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop({ type: Boolean, default: false })
  poll: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop({ type: Boolean, default: false })
  QandA: boolean;

  @Field(() => Number, { nullable: true, defaultValue: 1 })
  @Prop({ type: Number, default: 1 })
  noOfQuestions: number;

  @Field(() => Number, { nullable: true, defaultValue: 1 })
  @Prop({ type: Number, default: 1 })
  noOfPolls: number;

  @Field(() => [ChatEpisodeEntity], { nullable: true })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: ChatEpisodeEntity.name }])
  // @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatEpisodeEntity' }])  // Use this if "ChatEpisodeEntity.name" causes circular import error
  episodes: mongoose.Schema.Types.ObjectId[];

  @Field(() => [AICharacterEntityType], { nullable: true })
  @Prop({ type: [AICharacterEntityType] })
  aiCharacters: AICharacterEntityType[];
}

export const ChatEventSchema = SchemaFactory.createForClass(ChatEventEntity);

export type ChatEventDocument = ChatEventEntity & Document;
