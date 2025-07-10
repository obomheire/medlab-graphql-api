import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { Cost, StripeProduct } from './products.entity';
import { SlidePlanType } from '../enum/product.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class SlideProductEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  slideProductUUID: string;

  @Field(() => String)
  @Prop({
    type: String,
    enum: SlidePlanType,
  })
  name: SlidePlanType;

  @Field(() => Cost)
  @Prop()
  price: Cost;

  @Field(() => StripeProduct, { nullable: true })
  @Prop({ default: null })
  stripeProduct: StripeProduct;

  @Field(() => Boolean)
  @Prop()
  accessToTemplateDesigns: boolean;

  @Field(() => Boolean)
  @Prop()
  aiAssistanceWithSlideCreation: boolean;

  @Field(() => Boolean)
  @Prop()
  slideSharing: boolean;

  @Field(() => Number)
  @Prop()
  aiCredits: number;
}

export const SlideProductSchema =
  SchemaFactory.createForClass(SlideProductEntity);

export type SlideProductDocument = SlideProductEntity & Document;
