import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class QuizCatEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  categoryUUID?: string;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => String, { nullable: true })
  @Prop()
  name: string;
}

export const QuizCatSchema = SchemaFactory.createForClass(QuizCatEntity);

export type QuizCatDocument = QuizCatEntity & Document;
