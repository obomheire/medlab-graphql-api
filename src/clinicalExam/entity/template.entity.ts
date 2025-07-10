import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { TemplateCategory } from './types.entity';
import { CaseType } from '../enum/clinicalExam.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class TemplateEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  templateUUID: string;

  @Field(() => String)
  @Prop()
  category: string; //this is the exam category the template belongs to

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop({ default: false, type: Boolean })
  isFree: boolean;

  @Field(() => [TemplateCategory, { nullable: true }])
  @Prop()
  templates: TemplateCategory[];
}

export const TemplateSchema = SchemaFactory.createForClass(TemplateEntity);

export type TemplateDocument = TemplateEntity & Document;
