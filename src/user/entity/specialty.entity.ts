import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { Subspecialty } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class SpecialtyEntity {
  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: uuidv4 })
  specialtyUUID: string;

  @Field(() => String, { nullable: true })
  @Prop()
  specialty: string;

  @Field(() => [Subspecialty], { nullable: true })
  @Prop({ type: [Subspecialty] })
  subspecialty: Subspecialty[];
}

export const SpecialtySchema = SchemaFactory.createForClass(SpecialtyEntity);

export type SpecialtyDocument = SpecialtyEntity & Document;
