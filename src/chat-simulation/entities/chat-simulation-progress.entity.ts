import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatSimulationGeneratingProgressEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  progressUUID: string;

  @Field(() => Number)
  @Prop({ type: Number, maxlength: 100 })
  progress: number;

  @Field(() => String)
  @Prop({ type: String })
  eventName: string;

  @Field(() => Boolean, { defaultValue: false })
  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;
}

export const ChatSimulationGeneratingProgressSchema =
  SchemaFactory.createForClass(ChatSimulationGeneratingProgressEntity);

export type ChatSimulationGeneratingProgressDocument =
  ChatSimulationGeneratingProgressEntity & Document;
