import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';
import { MyQBType, TimerType } from '../enum/quiz.enum';
import { CustomCat } from 'src/user/entity/types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class QuizEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  quizUUID: string;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  coverImage?: string;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: null })
  isPublish?: boolean;

  @Field(() => String, { nullable: true }) // To be made mandatory
  @Prop()
  topic: string;

  @Field()
  @Prop({ default: MyQBType.MYQB })
  category: string;

  @Field(() => CustomCat, { nullable: true }) // NB: This field will be null for Medscroll quiz. To be made mandatory for users
  @Prop({ type: CustomCat })
  quizCategory: CustomCat;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  description?: string;

  @Prop({ default: false })
  isMedscroll?: boolean;

  @Field(() => Number)
  @Prop()
  point: number;

  @Field(() => String)
  @Prop()
  duration: string;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    default: TimerType.COUNT_DOWN_PER_QUESTION,
    enum: TimerType,
  })
  timer?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  totalDuration?: string;

  @Field(() => Number, { nullable: true })
  @Prop({ default: null })
  totalQuestion: number;
}

export const QuizSchema = SchemaFactory.createForClass(QuizEntity);

export type QuizDocument = QuizEntity & Document;
