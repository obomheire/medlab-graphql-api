import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GenderType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatAIAvatarEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  avatarUUID: string;

  @Field(() => String)
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  status: string;

  @Field(() => String)
  @Prop({ type: String })
  image: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, enum: GenderType })
  gender: GenderType;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  ethnicity: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  voiceId: string;
}

export const ChatAIAvatarSchema =
  SchemaFactory.createForClass(ChatAIAvatarEntity);

export type ChatAIAvatarDocument = ChatAIAvatarEntity & Document;
