import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserScoreType } from '../enum/quiz.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class UserQuizScoreEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  quizScoreUUID: string;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => String)
  @Prop()
  category: string; //NB: This is the feature that this quiz score belongs to

  @Field(() => String)
  @Prop()
  subcategory: string; //NB: This is the subcategory that this quiz score belongs to

  @Field(() => String, { nullable: true })
  @Prop()
  sectionTitle: string; //NB: This is the section title that this quiz score belongs to if it is a section quiz

  @Field(() => String)
  @Prop()
  question: string;

  @Field(() => String, { nullable: true })
  @Prop()
  questionUUID: string;

  @Field(() => String)
  @Prop()
  answer: string;

  @Field(() => [String], { nullable: true })
  @Prop()
  options: string[];

  @Field(() => Number, { nullable: true })
  @Prop()
  speed: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  speedBonus: number;

  @Field(() => String, { nullable: true })
  @Prop({ enum: UserScoreType, default: UserScoreType.MULTIPLE_CHOICE })
  type: UserScoreType;

  @Field(() => String, { nullable: true })
  @Prop()
  answer_details: string;

  @Field(() => String, { nullable: true })
  @Prop()
  optionSelected: string; //Nb: This is for multiple choice questions options selected by the user

  @Field(() => [String], { nullable: true })
  @Prop()
  openEndedSelected: string[]; //Nb: This is for open ended questions options selected or inputted by the user

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isCorrect?: boolean;

  @Field(() => Number)
  @Prop()
  score: number;

  @Field(() => String, { nullable: true })
  @Prop()
  feedback: string;
}

export const UserQuizScoreSchema =
  SchemaFactory.createForClass(UserQuizScoreEntity);

export type UserQuizScoreDocument = UserQuizScoreEntity & Document;
