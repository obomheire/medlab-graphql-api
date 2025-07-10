import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class TempFileEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  tempFileUUID?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  content?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  fileUrl?: string;
}

export const TempFileSchema = SchemaFactory.createForClass(TempFileEntity);

export type TempFileDocument = TempFileEntity & Document;
