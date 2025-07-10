import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { MedSynopsisCaseEntity } from './medsynopsisCase.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class MedSynopsisCategoryEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  categoryUUID: string;

  @Field(() => String)
  @Prop({ type: String, required: true, unique: true })
  title: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  description?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  coverImage?: string;

  @Field(() => MedSynopsisCaseEntity, { nullable: true })
  @Prop({ type: Types.ObjectId, ref: MedSynopsisCaseEntity.name })
  categoryContent: Types.ObjectId[];
}

export const MedSynopsisCategorySchema = SchemaFactory.createForClass(
  MedSynopsisCategoryEntity,
);

export type MedSynopsisCategoryDocument = MedSynopsisCategoryEntity & Document;
