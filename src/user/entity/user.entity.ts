import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import {
  CaseResult,
  Country,
  CustomCat,
  Disabled,
  Result,
  RevCartData,
  StripeCustomaData,
  Sub,
  UserThread,
  UsedResource,
  SlideSub,
  ClinExSub,
} from './types.entity';
import { PermissionsType } from '../enum/user.enum';
import { AppType } from 'src/stripe/enum/sub.plan.enum';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class UserEntity {
  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: uuidv4 })
  userUUID?: string;

  @Prop({ default: null })
  appleId?: string;

  @Prop({ default: null })
  facebookId?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  profileImage?: string;

  @Field(() => String)
  @Prop({ unique: true })
  username: string;

  @Field(() => String, { nullable: true })
  @Prop({ trim: true })
  firstName: string;

  @Field(() => String, { nullable: true })
  @Prop({ trim: true, default: '' })
  lastName?: string;

  @Field(() => String)
  @Prop({ unique: true, trim: true })
  email: string;

  @Prop({ default: null })
  password?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  phoneNumber?: string;

  @Field(() => Sub, { nullable: true })
  @Prop({ type: Sub })
  subscription: Sub;

  @Field(() => SlideSub, { nullable: true })
  @Prop({ type: SlideSub })
  slideSub: SlideSub;

  @Field(() => ClinExSub, { nullable: true })
  @Prop({ type: ClinExSub })
  clinExSub: ClinExSub;

  @Prop({ type: UsedResource })
  usedResources: UsedResource;

  @Field(() => Country, { nullable: true })
  @Prop({ type: Country })
  country: Country;

  @Field(() => CaseResult, { nullable: true })
  @Prop({ type: CaseResult })
  caseResults: CaseResult;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  state_city?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  role?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  specialty?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  subspecialty?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  heardAboutUs?: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  interest?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Prop({ default: false })
  personalized?: boolean;

  @Prop({ default: null })
  refreshToken?: string;

  @Prop({ default: null })
  otp?: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, enum: AppType, default: AppType.MEDSCROLL })
  @Prop({ default: AppType.MEDSCROLL })
  app?: AppType;

  @Prop({ default: null })
  otpExpiry?: Date;

  @Prop({ default: false })
  hasSubscribed?: boolean;

  @Prop({ default: false })
  hasSubSlide?: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isVerified?: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop({ default: false })
  isGuest?: boolean;

  @Field(() => Result, { nullable: true })
  @Prop({ type: Result })
  quizzer: Result;

  @Prop({ type: RevCartData, default: null })
  revenueCart?: RevCartData;

  @Field(() => UserThread, { nullable: true })
  @Prop({ type: UserThread })
  threads: UserThread;

  @Field(() => StripeCustomaData, { nullable: true })
  @Prop({ type: StripeCustomaData, default: null })
  stripeCustomer?: StripeCustomaData;

  @Field(() => StripeCustomaData, { nullable: true })
  @Prop({ type: StripeCustomaData, default: null })
  stripeSlideCust?: StripeCustomaData;

  @Field(() => StripeCustomaData, { nullable: true })
  @Prop({ type: StripeCustomaData, default: null })
  stripeClinExCust?: StripeCustomaData;

  @Field(() => Disabled, { nullable: true })
  @Prop({ type: Disabled })
  accountStatus: Disabled;

  // @Field(() => [CustomCat], { nullable: true })
  @Prop({ type: [CustomCat], default: [] })
  customCategory?: CustomCat[];

  @Prop({ default: null })
  playQuizAtDay?: Date;

  @Prop({ default: null })
  playQuizAtWeek?: Date;

  @Field(() => [String], { nullable: true })
  @Prop({
    type: [String],
    enum: PermissionsType,
    default: [PermissionsType.USER],
  })
  permissions?: PermissionsType[];

  @Field(() => [String], { nullable: true })
  @Prop({ type: [String], default: [] })
  completedLC?: string[];

  @Field(() => [String], { nullable: true })
  @Prop({ type: [String], default: [] })
  completedSC?: string[];

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);

export type UserDocument = UserEntity & Document;
