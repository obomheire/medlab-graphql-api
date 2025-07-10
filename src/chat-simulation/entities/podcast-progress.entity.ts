import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class PodcastProgressEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  progressUUID: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  userUUID: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  episodeUUID: string;

  @Field(() => Number)
  @Prop({ type: String, required: true })
  progress: number;

  @Field(() => Boolean)
  @Prop({ type: Boolean })
  isCompleted: boolean;
}

export const PodcastProgressSchema = SchemaFactory.createForClass(
  PodcastProgressEntity,
);

export type PodcastProgressDocument = PodcastProgressEntity & Document;
