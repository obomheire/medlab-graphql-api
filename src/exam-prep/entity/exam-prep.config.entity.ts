import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { ExamKnowledgeLevel } from '../enum/exam-prep.enum';
import { Document } from 'mongoose';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ExamPrepConfigEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  configUUID: string;

  @Field(() => String)
  @Prop()
  userUUID: string;

  @Field(() => String)
  @Prop()
  examName: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  examDate: string;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    enum: ExamKnowledgeLevel,
    default: ExamKnowledgeLevel.BIGNNER,
  })
  examKnowledgeLevel?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  examCurriculumFile?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  examCurriculumContent?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  examQuestionFile?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  examQuestionContent?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  sampleQuestions?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  additionalInfo?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  threadId?: string;
}

export const ExamPrepConfigSchema =
  SchemaFactory.createForClass(ExamPrepConfigEntity);

export type ExamPrepConfigDocument = Document & ExamPrepConfigEntity;
