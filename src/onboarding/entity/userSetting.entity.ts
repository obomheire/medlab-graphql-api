import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';
import { UserQuestionDetails } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class UserSettingEntity {
  @Prop({ type: ObjectId })
  userId: ObjectId;

  @Field(() => [UserQuestionDetails])
  @Prop({ type: [UserQuestionDetails] })
  userChat: UserQuestionDetails[];

  @Field(() => Number, { defaultValue: 1, nullable: true })
  @Prop({ type: Number, default: 1 })
  progress: number;
}

export const UserSettingSchema =
  SchemaFactory.createForClass(UserSettingEntity);

export type UserSettingDocument = UserSettingEntity & Document;
