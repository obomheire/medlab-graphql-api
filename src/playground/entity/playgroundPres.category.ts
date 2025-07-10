import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { PlaygroundPresentationEntity } from './presentation.playground.entity';


@ObjectType()
@Schema(mongooseSchemaConfig)
export class PlaygroundPresCategoryEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  categoryUUID: string;

  @Field(() => String)
  @Prop({type: String})
  category: string;

  @Field(() => String, { nullable: true })
  @Prop({type: String})
  subCategory: string;

  @Field(() => String, { nullable: true })
  @Prop()
  topic: string;


  @Field(() => [PlaygroundPresentationEntity], { nullable: true })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: PlaygroundPresentationEntity.name }])
  presentations: mongoose.Schema.Types.ObjectId[];
}

export const PlaygroundPresCategorySchema =
  SchemaFactory.createForClass(PlaygroundPresCategoryEntity);

export type PlaygroundPresCategoryDocument =
PlaygroundPresCategoryEntity & Document;
