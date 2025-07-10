import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { UserEntity } from 'src/user/entity/user.entity';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
export class Image {
  @Field(() => String)
  @Prop()
  url: string;

  @Field(() => String, { nullable: true })
  @Prop()
  caption: string;
}

@ObjectType()
@Schema(mongooseSchemaConfig)
export class CaseEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  caseUUID: string;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => String)
  @Prop()
  caseId: string;

  @Field(() => Number)
  @Prop()
  level: number;

  @Field(() => String)
  @Prop()
  details: string;

  @Field(() => String, { nullable: true })
  @Prop()
  subject: string;

  @Field(() => String, { nullable: true })
  @Prop()
  keywords: string;

  @Field(() => Number, { defaultValue: 0 })
  @Prop()
  totalQuestion: number;

  @Field(() => [Image], { nullable: true })
  @Prop({ default: null })
  images?: Image[];

  @Prop()
  presentedTo?: string[];
}

export const CaseSchema = SchemaFactory.createForClass(CaseEntity);

export type CaseDocument = CaseEntity & Document;
