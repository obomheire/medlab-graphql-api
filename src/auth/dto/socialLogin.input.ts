import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AppType } from 'src/stripe/enum/sub.plan.enum';

@InputType()
export class CommonLoginInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  guestUUID?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  firstName: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsEnum(AppType)
  @IsOptional()
  app: AppType;
}

@InputType()
export class GoogleLoginInput extends CommonLoginInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@InputType()
export class SocialLoginInput extends CommonLoginInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  email?: string;
}
