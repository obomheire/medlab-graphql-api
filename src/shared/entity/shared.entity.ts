import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';
import { SharedContentType } from '../enum/shared.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class SharedEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  sharedUUID: string;

  @Prop({
    type: Types.ObjectId,
    refPath: 'contentModel', // Enables dynamic referencing
    required: true,
  })
  contentId: Types.ObjectId;

  @Field(() => String)
  @Prop({
    type: String,
    enum: SharedContentType,
  })
  sharedContent: SharedContentType;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  sharedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: UserEntity.name })
  sharedWith: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['PresentationEntity'],
  })
  contentModel: string;
}

export const SharedSchema = SchemaFactory.createForClass(SharedEntity);

export type SharedDocument = SharedEntity & Document;
