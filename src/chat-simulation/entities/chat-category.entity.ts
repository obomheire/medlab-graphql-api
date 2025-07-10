import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { ChatChannelEntity } from './chat-channel.entity';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatCategoryEntity {
  @Field(() => String)
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  categoryUUID: string;

  @Field(() => [ChatChannelEntity], { nullable: true })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: ChatChannelEntity.name }])
  channels: mongoose.Schema.Types.ObjectId[];
}

export const ChatCategorySchema =
  SchemaFactory.createForClass(ChatCategoryEntity);

export type ChatCategoryDocument = ChatCategoryEntity & Document;
