import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { UserEntity } from 'src/user/entity/user.entity';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { PractCaseCatEntity } from './practCaseCat.entity';
import GraphQLJSON from 'graphql-type-json';
import { ConvExaminers } from './types.entity';
@ObjectType()
@Schema(mongooseSchemaConfig)
export class ConversationEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  conversationUUID?: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  patientAgentId?: string;

  @Field(() => UserEntity)
  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => PractCaseCatEntity)
  @Prop({ type: Types.ObjectId, ref: PractCaseCatEntity.name })
  practCaseCatId: Types.ObjectId;

  @Field(() => GraphQLJSON, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  selfGrading?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Prop({ default: '' })
  transcript?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: '' })
  note?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: '' })
  threadId?: string;

  @Field(() => ConvExaminers, { nullable: true })
  @Prop({ default: null })
  examiners?: ConvExaminers;

  @Field(() => String, { nullable: true })
  @Prop({ default: '' })
  comment?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  aiGrading?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Prop({ default: '' })
  aiFeedback?: string;
}

export const ConversationSchema =
  SchemaFactory.createForClass(ConversationEntity);

export type ConversationDocument = ConversationEntity & Document;
