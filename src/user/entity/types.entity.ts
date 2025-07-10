import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { StripeCurrencyType } from 'src/stripe/enum/sub.plan.enum';

@ObjectType()
export class Report {
  @Field(() => Number, { nullable: true })
  @Prop()
  correct: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  incorrect: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  missed: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  correctQB: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  incorrectQB: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  missedQB: number;
}

@ObjectType()
export class Result {
  @Field(() => Number, { nullable: true })
  @Prop()
  totalQA: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  totalQBques: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  totalTriQues: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  totalPoints: number;

  @Field(() => Float, { nullable: true })
  @Prop()
  totalTimeTaken: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  ranking: number;

  @Field(() => String, { nullable: true })
  @Prop()
  cumulativeHours: string;

  @Field(() => String, { nullable: true })
  @Prop()
  dailyAverage: string;

  @Field(() => Float, { nullable: true })
  @Prop()
  perceDailyAve: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  dailyStreak: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  weeklyStreak: number;

  @Field(() => Report, { nullable: true })
  @Prop({ type: Report })
  performance: Report;
}

@ObjectType()
export class Disabled {
  @Field(() => Boolean, { nullable: true })
  @Prop()
  isDisabled: boolean;

  @Field(() => Date, { nullable: true })
  @Prop()
  dateDisabled: Date;
}

@ObjectType()
export class Subspecialty {
  @Field(() => String, { nullable: true })
  @Prop()
  subspecId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  subspecialty: string;
}

@ObjectType()
export class CustomCat {
  @Field(() => String, { nullable: true })
  @Prop()
  customCatId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  customCat: string;
}

@ObjectType()
export class Country {
  @Field(() => String, { nullable: true })
  @Prop()
  country: string;

  @Field(() => String, { nullable: true })
  @Prop()
  code: string;
}

@ObjectType()
export class Level {
  @Field(() => Number, { nullable: true })
  @Prop()
  current: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  currentPoints: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  currentCount: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  previous: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  lastTopLevel: number;
}

@ObjectType()
export class CaseResult {
  @Field(() => Number, { nullable: true })
  @Prop()
  repeats: number;

  @Field(() => Level, { nullable: true })
  @Prop({ type: Level })
  levels: Level;

  @Field(() => Number, { defaultValue: 0 })
  @Prop()
  averageSpeed: number;
}

@ObjectType()
export class Sub {
  @Field(() => String, { nullable: true })
  @Prop()
  plan: SubPlanType;

  @Field(() => String, { nullable: true })
  @Prop()
  productId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  identifier: string;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  isTrialPeriod: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  isActive: boolean;

  @Field(() => Number, { nullable: true })
  @Prop()
  topUpCredits: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  tokenBalance: number;

  @Field(() => String, { nullable: true })
  @Prop()
  maxNumQuestion: string;

  @Field(() => String, { nullable: true })
  @Prop()
  imageUploadPerQues: string;

  @Field(() => String, { nullable: true })
  @Prop()
  txtLimitPerQuestion: string;

  @Field(() => String, { nullable: true })
  @Prop()
  txtLimitPerOption: string;

  @Field(() => String, { nullable: true })
  @Prop()
  multiplayerCapacity: string;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  medicalTrivia: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  generalTrivia: boolean;

  @Field(() => String, { nullable: true })
  @Prop()
  storage: string;

  @Field(() => String, { nullable: true })
  @Prop()
  credits: string;

  @Field(() => Number, { nullable: true })
  @Prop()
  subCredits: number;
}

@ObjectType()
export class SlideSub {
  @Field(() => String, { nullable: true })
  @Prop()
  plan: SubPlanType;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  isTrialPeriod: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  isActive: boolean;

  @Field(() => Number, { nullable: true })
  @Prop()
  subCredits: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  tokenBalance: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  topUpCredits: number;
}

@ObjectType()
export class ClinExSub extends SlideSub {
  @Field(() => Boolean, { nullable: true })
  @Prop()
  isTrialLC: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  isTrialSC: boolean;
}
export class RevCartData {
  @Prop()
  revcartUUID: string;

  @Prop()
  revcartCustomeId: string;

  @Prop()
  transactionId: string;

  @Prop()
  subInterval: string;

  @Prop()
  subStatus: string;

  @Prop()
  purchasedAt: Date;

  @Prop()
  expirationAt: Date;

  @Prop()
  revcartEventsId: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

@ObjectType()
export class UsedResource {
  @Prop()
  questions: number;

  @Prop()
  storage: number;

  @Prop()
  credits: number;
}

@ObjectType()
export class StripePayData {
  @Field(() => String, { nullable: true })
  @Prop()
  stripePayId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  stripePayStatus: string;

  @Field(() => Number, { nullable: true })
  @Prop()
  amount: number;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    enum: StripeCurrencyType,
  })
  currency: StripeCurrencyType;
}

@ObjectType()
export class StripeSubData {
  @Field(() => String, { nullable: true })
  @Prop()
  stripeSubId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  stripeSubItemId: string;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    enum: SubPlanType,
  })
  stripeSubPlanName: SubPlanType;

  @Field(() => String, { nullable: true })
  @Prop()
  chargeInterval: string;

  @Field(() => String, { nullable: true })
  @Prop()
  stripeSubStatus: string; // incomplete, incomplete_expired, trialing, active, past_due,  canceled, unpaid

  @Field(() => Boolean, { nullable: true })
  @Prop()
  cancelAtPeriodEnd: boolean;
}

@ObjectType()
export class StripeCustomaData {
  @Field(() => String, { nullable: true })
  @Prop()
  stripeCustomerUUID: string;

  @Field(() => String, { nullable: true })
  @Prop()
  stripeCustomerId: string;

  @Field(() => String, { nullable: true })
  @Prop()
  defaultPaymentMethod: string;

  @Field(() => [String], { nullable: true })
  @Prop()
  stripeEventsId: string[];

  @Field(() => StripeSubData, { nullable: true })
  @Prop()
  stripeSub: StripeSubData;

  @Field(() => StripePayData, { nullable: true })
  @Prop()
  stripePayment: StripePayData;

  @Field(() => Date, { nullable: true })
  @Prop()
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  @Prop()
  updatedAt: Date;
}

@ObjectType()
export class UserThread {
  @Field(() => String, { nullable: true })
  @Prop()
  chatAssistant: string;

  @Field(() => String, { nullable: true })
  @Prop()
  caseRecall: string;

  @Field(() => String, { nullable: true })
  @Prop()
  clinicalExam: string;
}
