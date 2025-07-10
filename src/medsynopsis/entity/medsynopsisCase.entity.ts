import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class MedSynopsisCaseEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  caseUUID: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  categoryUUID: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  caseTitle: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  caseContent: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  question: string;

  @Field(() => Boolean, { nullable: true })
  @Prop({ type: Boolean, default: false, required: false })
  reviewed: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ type: Boolean, default: false, required: false })
  isGradeStrictly: boolean;

  @Field(() => String)
  @Prop({ type: String, required: true })
  caseSummary: string;
}

export const MedSynopsisCaseSchema = SchemaFactory.createForClass(
  MedSynopsisCaseEntity,
);

export type MedSynopsisCaseDocument = MedSynopsisCaseEntity & Document;
