import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { Answer, Option, Subcategory, Vote } from './type.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { Difficulty, QuestionType, UsmleQuestionType } from '../enum/quiz.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class QuestionEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  questionUUID?: string;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId?: Types.ObjectId;

  @Field(() => String, { nullable: true })
  @Prop()
  quizUUID?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  caseUUID?: string;

  @Field(() => [Vote], { nullable: true })
  @Prop()
  votes?: Vote[];

  @Field(() => [String], { nullable: true })
  @Prop()
  images: string[];

  @Field(() => String)
  @Prop()
  question: string;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    default: QuestionType.SINGLECHOICE,
    enum: QuestionType,
  })
  mode?: QuestionType;

  @Field(() => Number, { nullable: true })
  // @Prop()
  questionNumber?: number;

  @Field(() => [Option])
  @Prop()
  options: Option[];

  @Field(() => Answer)
  @Prop()
  answer: Answer;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop()
  isGradeStrictly?: boolean;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  subject?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  system?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  contentBreakdown?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  focusArea?: string; // used for USMLE Step 2 CK exam

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  competency?: string;

  @Field(() => String, { nullable: true })
  @Prop({
    default: null,
  })
  questionType?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  category?: string;

  // @Field(() => String, { nullable: true })
  @Prop({ default: null })
  quizCategoryId?: string;

  @Field(() => Subcategory, { nullable: true })
  @Prop({ default: null })
  subcategory?: Subcategory;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  specialty?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  subspecialty?: string;

  @Field(() => String, { nullable: true }) // To be removed
  @Prop({ default: null })
  topic?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  subtopic?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  keywords?: string;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  reviewed?: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: true })
  hasOptions?: boolean;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  comments?: string;

  @Field(() => String, { nullable: true, defaultValue: Difficulty.EASY })
  @Prop({ default: Difficulty.EASY, enum: Difficulty })
  difficulty?: string;

  @Field(() => Number, { nullable: true })
  @Prop({ default: null })
  level?: number;

  // @Field(() => [String])
  @Prop()
  presentedTo?: string[];
}

export const QuestionSchema = SchemaFactory.createForClass(QuestionEntity);

export type QuestionDocument = QuestionEntity & Document;
