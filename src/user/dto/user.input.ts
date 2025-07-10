import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { AppType } from 'src/stripe/enum/sub.plan.enum';

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsString()
  newPassword: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  otp: string;
}

@InputType()
export class ContactUsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsOptional()
  // @Matches(/^\+[1-9]\d{1,14}$/, {
  //   message: 'Invalid phone number format',
  // })
  phoneNumber: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  message: string;
}

@InputType()
export class CreditUserInput {
  @Field(() => String)
  email: string;

  @Field(() => Number)
  amount: number;

  @Field(() => String, {
    nullable: true,
    description: 'Expected: MEDSCROLL or MEDSCROLL_SLIDE (default: MEDSCROLL)',
  })
  @IsOptional()
  @IsEnum(AppType)
  app: AppType;
}
