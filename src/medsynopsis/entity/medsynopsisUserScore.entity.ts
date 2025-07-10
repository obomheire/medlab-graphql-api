/* eslint-disable prettier/prettier */
import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserRecord } from './types.entity';
import { Document } from 'mongoose';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class MedSynopsisUserScoreEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  MedScoreUUID: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  userUUID: string;

  @Field(() => [UserRecord])
  @Prop({ type: [UserRecord] })
  userData: UserRecord[];
}

export const MedSynopsisUserScoreSchema = SchemaFactory.createForClass(
  MedSynopsisUserScoreEntity,
);

export type MedSynopsisUserScoreDocument = MedSynopsisUserScoreEntity &
  Document;
