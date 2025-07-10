import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
export class Cost {
  @Field(() => Float)
  @Prop()
  monthly: number;

  @Field(() => Float)
  @Prop()
  yearly: number;

  @Field(() => Float, { nullable: true })
  @Prop()
  payPerUse?: number;
}

@ObjectType()
export class StripeProduct {
  @Field(() => String, { nullable: true })
  @Prop()
  stripeProductId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  monthlyPriceId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  yearlyPriceId: string;
}

@ObjectType()
export class TokenTopUp {
  @Field(() => Number, { nullable: true })
  @Prop()
  unitAmount: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  value: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  amount: number;
}

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ProductEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  productUUID: string;

  @Field(() => String)
  @Prop({
    type: String,
    enum: SubPlanType,
  })
  plan: SubPlanType;

  @Field(() => Cost)
  @Prop()
  amount: Cost;

  @Field(() => StripeProduct, { nullable: true })
  @Prop({ default: null })
  stripeProduct: StripeProduct;

  @Field(() => TokenTopUp, { nullable: true })
  @Prop({ default: null })
  tokenTopUp: TokenTopUp;

  @Field(() => Boolean)
  @Prop()
  medicalTrivia: boolean;

  @Field(() => Boolean)
  @Prop()
  generalTrivia: boolean;

  @Field(() => String)
  @Prop()
  multiplayerCapacity: string;

  @Field(() => String)
  @Prop()
  caseRecall: string;

  @Field(() => String)
  @Prop()
  medsynopsis: string;

  @Field(() => String)
  @Prop()
  casePresentation: string;

  @Field(() => String)
  @Prop()
  quizAI: string;

  @Field(() => String)
  @Prop()
  storage: string;

  @Field(() => String)
  @Prop()
  credits: string;
}

export const ProductSchema = SchemaFactory.createForClass(ProductEntity);

export type ProductDocument = ProductEntity & Document;
