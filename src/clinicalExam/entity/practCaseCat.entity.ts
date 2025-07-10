import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { PractCaseEntity } from './practCase.entity';
import { CaseType } from '../enum/clinicalExam.enum';
import { Examiners, PatientProfile } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class PractCaseCatEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  practCaseCatUUID?: string;

  @Field(() => PractCaseEntity, { nullable: true })
  @Prop({ type: Types.ObjectId, ref: PractCaseEntity.name })
  practCaseId: Types.ObjectId;

  @Field(() => String)
  @Prop()
  name: string;

  @Field(() => String)
  @Prop()
  caseNo: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  description: string;

  @Field(() => String)
  @Prop()
  time: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  image: string;

  @Field(() => String)
  @Prop()
  patientOverview: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  medications: string;

  @Field(() => PatientProfile, { nullable: true })
  @Prop({ type: PatientProfile, default: null })
  patientProfile?: PatientProfile;

  @Field(() => Examiners, { nullable: true })
  @Prop({ type: Examiners, default: null })
  examiners?: Examiners;

  @Field(() => String, { nullable: true })
  @Prop({ default: '' })
  physicalExam: string;

  @Field(() => String)
  @Prop()
  caseType: CaseType;
}

export const CaseCategorySchema =
  SchemaFactory.createForClass(PractCaseCatEntity);

export type CaseCategoryDocument = PractCaseCatEntity & Document;
