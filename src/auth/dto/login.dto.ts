import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class AuthLoginInput {
  @Field({ nullable: true })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  unique?: string;
}
