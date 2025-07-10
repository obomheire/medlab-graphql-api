import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { PractCaseCatEntity } from './practCaseCat.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import GraphQLJSON from 'graphql-type-json';
import { LongCase, ShortCase } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class GradeEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  gradeUUID?: string;

  @Field(() => UserEntity)
  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => PractCaseCatEntity)
  @Prop({ type: Types.ObjectId, ref: PractCaseCatEntity.name })
  preactCaseCatId: Types.ObjectId;

  @Field(() => ShortCase, { nullable: true })
  @Prop({ type: ShortCase, default: null })
  shortCase?: ShortCase;

  @Field(() => LongCase, { nullable: true })
  @Prop({ type: LongCase, default: null })
  longCase?: LongCase;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  comment: string;

  @Field(() => Date)
  createdAt?: Date;

  @Field(() => GraphQLJSON, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  aiGrading?: Record<string, any>;
}

export const GradeSchema = SchemaFactory.createForClass(GradeEntity);

export type GradeDocument = GradeEntity & Document;
