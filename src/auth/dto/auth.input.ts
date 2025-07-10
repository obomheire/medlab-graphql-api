import { InputType, Field } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AppType } from 'src/stripe/enum/sub.plan.enum';

@InputType()
export class SignUpInput {
  @Field(() => String, { nullable: true })
  guestUUID: string;

  @Field(() => String, { nullable: true })
  firstName: string;

  @Field(() => String, { nullable: true })
  lastName: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  password: string;

  @Field(() => String, { nullable: true })
  @IsEnum(AppType)
  @IsOptional()
  app: AppType;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class GetOtpInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@InputType()
export class ValidateOtpInput extends GetOtpInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  otp: string;
}
