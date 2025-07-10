import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import {
  UserFollowingChannelsType,
  UserVisitedChannelsType,
  UserVisitedEventsEpisodeType,
  UserVisitedEventsType,
} from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatUserActivityEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  userActivityUUID: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  userUUID: string;

  @Field(() => [UserVisitedEventsEpisodeType], {
    nullable: true,
    defaultValue: [],
  })
  @Prop({ type: [UserVisitedEventsEpisodeType], default: [] })
  visitedEventsEpisode: UserVisitedEventsEpisodeType[];

  @Field(() => [UserVisitedEventsType], { nullable: true, defaultValue: [] })
  @Prop({ type: [UserVisitedEventsType], default: [] })
  visitedEvents: UserVisitedEventsType[];

  @Field(() => [UserVisitedChannelsType], { nullable: true, defaultValue: [] })
  @Prop({ type: [UserVisitedChannelsType], default: [] })
  visitedChannels: UserVisitedChannelsType[];

  @Field(() => [UserFollowingChannelsType], { nullable: true })
  @Prop({ type: [UserFollowingChannelsType] })
  channelsFollowed: UserFollowingChannelsType[];
}

export const ChatUserActivitySchema = SchemaFactory.createForClass(
  ChatUserActivityEntity,
);

export type ChatUserActivityDocument = ChatUserActivityEntity & Document;
