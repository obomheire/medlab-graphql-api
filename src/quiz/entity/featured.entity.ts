import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class FeaturedEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  featureUUID: string;

  @Field(() => String)
  @Prop()
  title: string;

  @Field(() => String)
  @Prop()
  description: string;

  @Field(() => String)
  @Prop()
  color: string;

  @Field(() => String)
  @Prop()
  image: string;

  @Field(() => String)
  @Prop()
  route: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  quizUUID: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  category: string;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isGuest: boolean;
}

export const FeaturedSchema = SchemaFactory.createForClass(FeaturedEntity);

export type FeaturedDocument = FeaturedEntity & Document;
