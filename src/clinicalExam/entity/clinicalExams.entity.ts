import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { SampleQues } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ClinicalExamEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  examUUID: string;

  @Field(() => String)
  @Prop()
  name: string;

  @Field(() => String, { nullable: true })
  @Prop()
  description: string;

  @Field(() => String, { nullable: true })
  @Prop()
  image: string;

  @Field(() => Float)
  @Prop()
  amount: number;

  @Field(() => String)
  @Prop()
  about: string;

  @Field(() => String)
  @Prop()
  markingScheme: string;

  @Field(() => SampleQues)
  @Prop({ type: SampleQues })
  sampleQuestion: SampleQues;
}

export const ClinicalExamSchema =
  SchemaFactory.createForClass(ClinicalExamEntity);

export type ClinicalExamDocument = ClinicalExamEntity & Document;
