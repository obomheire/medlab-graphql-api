import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';
import GraphQLJSON from 'graphql-type-json';
import { AddInfo, Preview, Ref } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class PresentationEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  presUUID: string;

  @Field(() => UserEntity, { nullable: true })
  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => String, { nullable: true })
  @Prop()
  threadId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  title: string;

  @Field(() => String, { nullable: true })
  @Prop()
  subTitle: string;

  @Field(() => [Preview], { nullable: true })
  @Prop({ default: null })
  slidesPreview: Preview[];

  @Field(() => [GraphQLJSON], { nullable: true })
  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  script: Record<string, any>[];

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  note: string;

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

  @Field(() => Boolean)
  @Prop({ default: false })
  isDraft: boolean;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  inviteCode: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  audience: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  goals: string;

  @Field(() => Ref, { nullable: true })
  @Prop({ type: Ref, default: null })
  reference: Ref;

  @Field(() => AddInfo, { nullable: true })
  @Prop({ default: null })
  addInfo: AddInfo;

  @Field(() => Date)
  createdAt: Date;
}

export const PresentationSchema =
  SchemaFactory.createForClass(PresentationEntity);

export type PresentationDocument = PresentationEntity & Document;
