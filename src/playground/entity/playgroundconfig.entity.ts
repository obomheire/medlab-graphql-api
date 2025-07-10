import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import {
  PlaygroundSampleQuestionTypeEntity,
  PlaygroundTemplateTypeEntity,
  PlaygroundTypesEntity,
} from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class PlaygroundConfigEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  configUUID: string;

  @Field(() => PlaygroundTypesEntity, { nullable: true })
  @Prop({ default: null, type: PlaygroundTypesEntity })
  masterOutline: PlaygroundTypesEntity;

  @Field(() => PlaygroundTemplateTypeEntity, { nullable: true })
  @Prop({ default: null, type: PlaygroundTemplateTypeEntity })
  template: PlaygroundTemplateTypeEntity;

  @Field(() => PlaygroundSampleQuestionTypeEntity, { nullable: true })
  @Prop({ default: null, type: PlaygroundSampleQuestionTypeEntity })
  sampleQuestion: PlaygroundSampleQuestionTypeEntity;

  @Field(() => String)
  @Prop({ type: String })
  category: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  subcategory: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  subject: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  specialty: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  subspecialty: string;
}

export const PlaygroundConfigSchema = SchemaFactory.createForClass(
  PlaygroundConfigEntity,
);

export type PlaygroundConfigDocument = PlaygroundConfigEntity & Document;
