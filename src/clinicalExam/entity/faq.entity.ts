import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class FaqEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  faqUUID: string;

  @Field(() => String)
  @Prop()
  question: string;

  @Field(() => String, { nullable: true })
  @Prop()
  answer: string;
}

export const FaqSchema = SchemaFactory.createForClass(FaqEntity);

export type FaqDocument = FaqEntity & Document;
