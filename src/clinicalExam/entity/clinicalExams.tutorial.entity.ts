import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { TutorialSectionQuiz, TutorialSectionType } from './types.entity';
import { UserQuizScoreEntity } from 'src/quiz/entity/userQuizScoreEntity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ClinicalExamTutorialEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  tutorialUUID: string;

  @Field(() => String)
  @Prop()
  category: string;

  @Field(() => String)
  @Prop({ required: true })
  sectionTitle: string;

  @Field(() => String, { nullable: true })
  @Prop({ nullable: true })
  order?: string; // This is the order of the section

  @Field(() => [TutorialSectionQuiz], { nullable: true })
  @Prop({ nullable: true, default: [] })
  quiz?: TutorialSectionQuiz[];

  @Field(() => [TutorialSectionType, { nullable: true }])
  @Prop()
  section: TutorialSectionType[];

  @Field(() => String, { nullable: true })
  @Prop()
  coverImage?: string;

  @Field(() => Date, { nullable: true })
  @Prop({ type: Date })
  upcomingTutDate: Date;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop({ type: Boolean, default: false })
  isUpcoming: boolean;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  upcomingTutDuration: string;
}

export const ClinicalExamTutorialSchema = SchemaFactory.createForClass(
  ClinicalExamTutorialEntity,
);

export type ClinicalExamTutorialDocument = ClinicalExamTutorialEntity &
  Document;
