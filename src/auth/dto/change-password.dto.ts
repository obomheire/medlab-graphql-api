import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
