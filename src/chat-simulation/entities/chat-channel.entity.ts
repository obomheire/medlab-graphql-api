import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { ChatEventEntity } from './chat-event.entity';
import { v4 as uuidv4 } from 'uuid';
import { defaultImages } from '../constants/data.constant';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatChannelEntity {
  @Field(() => String)
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  channelUUID: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  description: string;

  @Field(() => String)
  @Prop({ type: String })
  categoryName: string;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    default: defaultImages.defaultChannelImage,
  })
  coverImage: string;

  @Field(() => [ChatEventEntity], { nullable: true })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: ChatEventEntity.name }])
  events: mongoose.Schema.Types.ObjectId[];
}

export const ChatChannelSchema =
  SchemaFactory.createForClass(ChatChannelEntity);

export type ChatChannelDocument = ChatChannelEntity & Document;
