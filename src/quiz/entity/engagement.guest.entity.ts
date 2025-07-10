import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class EngagementGuestEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  guestUUID: string;

  @Field(() => String)
  @Prop({ type: String })
  name: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  image: string;

  @Field(() => String)
  @Prop({ type: String })
  ipAddress: string;
}

export const EngagementGuestSchema = SchemaFactory.createForClass(
  EngagementGuestEntity,
);

export type EngagementGuestDocument = EngagementGuestEntity & Document;
