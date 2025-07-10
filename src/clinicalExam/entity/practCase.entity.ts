import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class PractCaseEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  practCaseUUID: string;

  @Field(() => String)
  @Prop()
  name: string;

  @Field(() => String, { nullable: true })
  @Prop()
  description: string;

  @Field(() => String, { nullable: true })
  @Prop()
  image: string;

  @Field(() => String, { nullable: true })
  @Prop()
  logo: string;

  @Prop({ default: false })
  isActive?: boolean;
}

export const PractCaseSchema = SchemaFactory.createForClass(PractCaseEntity);

export type PractCaseDocument = PractCaseEntity & Document;
