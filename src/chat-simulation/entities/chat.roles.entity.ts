import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ChatAIRolesEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  roleUUID: string;

  @Field(() => String)
  @Prop({ type: String, required: true, unique: true })
  role: string;
}

export const ChatAIRolesSchema =
  SchemaFactory.createForClass(ChatAIRolesEntity);

export type ChatAIRolesDocument = ChatAIRolesEntity & Document;
