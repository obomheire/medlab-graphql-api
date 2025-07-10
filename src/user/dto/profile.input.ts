import { InputType, Field } from '@nestjs/graphql';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PermissionsType } from '../enum/user.enum';

@InputType()
export class EditProfileInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  lastName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  username: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  country: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  countryCode: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  state_city: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  role: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  specialty: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subspecialty: string;
}

@InputType()
export class TogglePermission {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  @IsEnum(PermissionsType, { each: true })
  permissions: PermissionsType[];
}
