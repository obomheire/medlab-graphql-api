import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { EngagementCategory, EngagementType } from '../enum/engagement.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class EngagementEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  commentUUID: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, required: false })
  inviteCode: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  message: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  sender: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  image: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  messageThread?: string; // this will be used to track ai response

  @Field(() => Number)
  @Prop({ type: Number, default: 0 })
  likes: number;

  @Field(() => [String])
  @Prop({ type: [String], default: [] })
  usersLikes: string[];

  @Field(() => String)
  @Prop({
    type: String,
    required: true,
    enum: EngagementType,
    default: EngagementType.COMMENT,
  })
  engagementType: EngagementType;

  @Field(() => String)
  @Prop({
    type: String,
    required: true,
    enum: EngagementCategory,
    default: EngagementCategory.SLIDE,
  })
  category: EngagementCategory;

  @Field(() => [EngagementEntity])
  @Prop({ type: [Types.ObjectId], ref: 'EngagementEntity' })
  replies: EngagementEntity[];

  @Field(() => String, { nullable: true })
  @Prop({ type: String, index: true, default: null })
  parentId?: string;

  @Field(() => Boolean, { nullable: true })
  @Prop({ type: Boolean, default: false })
  isAI?: boolean;

  //   @Field(() => Date)
  //   @Prop({ type: Date, default: Date.now })
  //   createdAt: Date;
}

export const EngagementSchema = SchemaFactory.createForClass(EngagementEntity);

export type EngagementDocument = EngagementEntity & Document;
