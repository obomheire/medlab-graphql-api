import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';
import { Thread } from './types.entity';
import { ComponentType } from '../enum/assistantAI.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ThreadGrpEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  threadGrpUUID: string;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => String)
  @Prop()
  dateCreated: string;

  @Field(() => String)
  @Prop()
  component: ComponentType;

  @Field(() => [Thread], { nullable: true })
  @Prop({ type: Thread })
  threads: Thread[];
}

export const ThreadGrpSchema = SchemaFactory.createForClass(ThreadGrpEntity);

export type ThreadGrpDocument = ThreadGrpEntity & Document;
