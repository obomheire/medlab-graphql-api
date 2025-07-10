import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { MedSysnopsisUserCaseProp } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class MedSynopsisUserCaseEntity {
  @Field(() => String)
  @Prop({ type: String, required: true })
  userUUID: string;

  @Field(() => [MedSysnopsisUserCaseProp])
  @Prop({ type: [MedSysnopsisUserCaseProp], required: true })
  userData: MedSysnopsisUserCaseProp[];
}

export const MedSynopsisUserCaseSchema = SchemaFactory.createForClass(
  MedSynopsisUserCaseEntity,
);
export type MedSynopsisUserCaseDocument = MedSynopsisUserCaseEntity & Document;
