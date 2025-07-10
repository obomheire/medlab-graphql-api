import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from './user.entity';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class LeaderboardEntity {
  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: uuidv4 })
  leaderboardUUID?: string;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Prop({ default: null })
  region: string;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  timeTaken: number;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    enum: ComponentType,
  })
  component: ComponentType;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    enum: ComponentType,
  })
  subComponent: ComponentType;
}

export const LeaderboardSchema =
  SchemaFactory.createForClass(LeaderboardEntity);

export type LeaderboardDocument = LeaderboardEntity & Document;
