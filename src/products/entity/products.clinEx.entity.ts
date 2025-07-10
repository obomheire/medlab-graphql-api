import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { ClinExPlanType } from '../enum/product.enum';

@ObjectType()
export class Price {
  @Field(() => Float)
  @Prop()
  monthly: number;

  @Field(() => Float)
  @Prop()
  fourMonths: number;
}

@ObjectType()
export class AIcredit extends Price {}
@ObjectType()
export class ClinExamProduct {
  @Field(() => String, { nullable: true })
  @Prop()
  stripeProductId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  monthlyPriceId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  fourMonthsPriceId: string;
}

@ObjectType()
@Schema(mongooseSchemaConfig)
export class ClinExamProdEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  clinExProdUUID: string;

  @Field(() => String)
  @Prop({
    type: String,
    enum: ClinExPlanType,
  })
  name: ClinExPlanType;

  @Field(() => Price)
  @Prop()
  price: Price;

  @Field(() => ClinExamProduct, { nullable: true })
  @Prop({ default: null })
  stripeProduct: ClinExamProduct;

  @Field(() => Boolean)
  @Prop()
  examOverview: boolean;

  @Field(() => String)
  @Prop()
  lcTemplate: string;

  @Field(() => String)
  @Prop()
  scTemplate: string;

  @Field(() => String)
  @Prop()
  onlineTutor: string;

  @Field(() => String)
  @Prop()
  recordCasePres: string;

  @Field(() => String)
  @Prop()
  aiFeedback: string;

  @Field(() => AIcredit)
  @Prop()
  aiCredit: AIcredit;

  @Field(() => Boolean)
  @Prop()
  aiLCPractice: boolean;

  @Field(() => Boolean)
  @Prop()
  aiSCPractice: boolean;
}

export const ClinExamProdSchema =
  SchemaFactory.createForClass(ClinExamProdEntity);

export type ClinExamProdDocument = ClinExamProdEntity & Document;
