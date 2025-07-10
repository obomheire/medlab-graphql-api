import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';
import GraphQLJSON from 'graphql-type-json';
import { PlaygroundAddInfo, PlaygroundPreview, PlaygroundRef } from './playgroundPres.entity.types';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class PlaygroundPresentationEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  presUUID: string;

  // @Field(() => UserEntity, { nullable: true })
  // @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  // userId: Types.ObjectId;

  @Field(() => String, { nullable: true })
  @Prop()
  threadId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  title: string;

  @Field(() => String, { nullable: true })
  @Prop()
  subTitle: string;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isUploadType: boolean; // this help to determine if the presentation is created by upload type

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isEmbeded: boolean; // this help to determine if the presentation is created by embeded type

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isUrlType: boolean; // this help to determine if the presentation is created by url type

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: true })
  isMedScroll: boolean; // this help to determine if the presentation is created by medscroll

  @Field(() => [PlaygroundPreview], { nullable: true })
  @Prop({ default: null })
  slidesPreview: PlaygroundPreview[];

  @Field(() => [GraphQLJSON], { nullable: true })
  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  script: Record<string, any>[];

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  note: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  description: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  theme: string; // Presentation background

  @Field(() => Boolean)
  @Prop({ default: false })
  isPublic: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: true })
  activateAIComment: boolean; // should AI automatically engage with the audience

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: true })
  activateAIQuestion: boolean; // should AI automatically engage with the audience

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  activateAuthorAvatar: boolean; // should author avatar be shown

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isDraft: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isPublished: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isBulk: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  inReview: boolean;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  inviteCode: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  audience: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  goals: string;

  @Field(() => PlaygroundRef, { nullable: true })
  @Prop({ type: PlaygroundRef, default: null })
  reference: PlaygroundRef;

  @Field(() => PlaygroundAddInfo, { nullable: true })
  @Prop({ default: null })
  addInfo: PlaygroundAddInfo;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  canForward: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  showLeaderboard: boolean;

  @Field(() => Date)
  createdAt: Date;
}

export const PlaygroundPresentationSchema =
  SchemaFactory.createForClass(PlaygroundPresentationEntity);

export type PlaygroundPresentationDocument =
  PlaygroundPresentationEntity & Document;
