import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { UserEntity } from 'src/user/entity/user.entity';
import { AICharacterType } from '../enums/chat-simuation.enum';
import { GenderType } from 'src/llm-providers/openAI/enum/assistantAI.enum';

// @ObjectType()
// export class EngagementSettings {
//     @Field(()=>String,)
//     @Prop({type: String})
//     title: string

//     @Field(()=>String, {nullable: true})
//     @Prop({type: String})
//     type: string

//     @Field(()=>Number, {nullable: true})
//     @Prop({type: Number})
//     noOfQuestions: number

//     @Field(()=>Boolean, {defaultValue: false})
//     @Prop({type: Boolean, default: false})
//     status: boolean
// }

// @ObjectType()
// export class QAndACommentType {
//     @Field(()=> String)
//     @Prop({type: String})
//     question: string

//     @Field(()=> String, {nullable: true})
//     @Prop({type: String})
//     comments: string[]

//     @Field(()=> Number, {nullable: true, defaultValue: 0})
//     @Prop({type: Number, default: 0})
//     likes: number

//     @Field(()=> Date)
//     @Prop({type: Date})
//     date: Date

//     @Field(()=>[UserEntity], {nullable: true})
//     @Prop([{type: mongoose.Schema.Types.ObjectId, ref: UserEntity.name}])
//     userId: mongoose.Schema.Types.ObjectId[]
// }

@ObjectType()
export class QAndAType {
  @Field(() => String)
  @Prop({ type: String })
  questionUUID: string;

  @Field(() => String)
  @Prop({ type: String })
  question: string;

  @Field(() => [QAndAType], { nullable: true })
  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  comments: QAndAType[];

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  @Prop({ type: Number, default: 0 })
  likes: number;

  @Field(() => Date)
  @Prop({ type: Date })
  date: Date;

  @Field(() => [UserEntity], { nullable: true })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: UserEntity.name }])
  userId: mongoose.Schema.Types.ObjectId[];
}

@ObjectType()
export class PrivateChatType {
  @Field(() => String)
  @Prop({ type: String })
  chatUUID: string;

  @Field(() => String)
  @Prop({ type: String })
  chat: string;

  @Field(() => String) //normal user or AI
  @Prop({ type: String })
  userType: string;

  @Field(() => [UserEntity], { nullable: true })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: UserEntity.name }])
  userId: mongoose.Schema.Types.ObjectId[];
}

@ObjectType()
export class PollOptionType {
  @Field(() => String)
  id: string;

  @Field(() => String)
  value: string;

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  vote: number;
}

@Schema()
@ObjectType()
export class PollChatType {
  @Field(() => String)
  @Prop({ type: String })
  chatUUID: string;

  @Field(() => String)
  @Prop({ type: String })
  chat: string;

  @Field(() => Number)
  @Prop({ type: Number })
  likes: number;

  @Field(() => [PollChatType], { nullable: true })
  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  comments: PollChatType[];

  @Field(() => [UserEntity], { nullable: true })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: UserEntity.name }])
  userId: mongoose.Schema.Types.ObjectId[];
}

@ObjectType()
export class PollType {
  @Field(() => String)
  @Prop({ type: String })
  questionUUID: string;

  @Field(() => String)
  @Prop({ type: String })
  question: string;

  @Field(() => [PollOptionType])
  @Prop({ type: [PollOptionType] })
  options: PollOptionType[];

  @Field(() => [PollChatType])
  @Prop({ type: [PollChatType] })
  comments: PollChatType[];
}

@ObjectType()
export class AICharacterEntityType {
  @Field(() => String)
  @Prop({ type: String })
  name: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  bio: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  persona: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  quirks: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  image: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  catchPhrase: string;

  @Field(() => String, { defaultValue: AICharacterType.PANELIST })
  @Prop({ type: String })
  role: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, enum: GenderType })
  gender: GenderType;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  voiceId: string;
}

@ObjectType()
export class MasterOutlineRes {
  @Field(() => String, { nullable: true })
  system: string;

  @Field(() => [String], { nullable: true })
  topics: string[];
}

@ObjectType()
export class ConvertSimulationType {
  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  name: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  image: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  gender?: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  conversation: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  time?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop({ type: Boolean })
  read?: boolean;
}

@ObjectType()
export class UserVisitedEventsEpisodeType {
  @Field(() => String)
  @Prop({ type: String })
  eventName: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  visitedEpisodes: string;

  @Field(() => Date)
  @Prop({ type: Date })
  visitedDate: Date;
}

@ObjectType()
export class UserVisitedChannelsType {
  @Field(() => String)
  @Prop({ type: String })
  channelName: string;

  @Field(() => Date)
  @Prop({ type: Date })
  visitedDate: Date;
}

@ObjectType()
export class UserVisitedEventsType {
  @Field(() => String)
  @Prop({ type: String })
  eventName: string;

  @Field(() => Date)
  @Prop({ type: Date })
  visitedDate: Date;
}

@ObjectType()
export class UserFollowingChannelsType {
  @Field(() => String)
  @Prop({ type: String })
  channelName: string;

  // @Field(()=> String)
  // @Prop({type: String})
  // channelUUID: string

  @Field(() => Date)
  @Prop({ type: Date })
  followedDate: Date;
}
