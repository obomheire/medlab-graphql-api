import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import { Drive } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class DriveEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  driveUUID: string;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  userId: Types.ObjectId;

  @Field(() => String)
  @Prop()
  dateCreated: string;

  @Field(() => String)
  @Prop({ default: null })
  component: ComponentType;

  @Field(() => Drive, { nullable: true })
  @Prop({ type: Drive })
  content: Drive;
}

export const DriveSchema = SchemaFactory.createForClass(DriveEntity);

export type DriveDocument = DriveEntity & Document;
