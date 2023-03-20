import { InputType, Field, Int, PartialType, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsNumber, IsDate, IsBoolean, ValidateNested } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { Designation } from 'src/role/entities/designation.entity';
import { Role } from 'src/role/entities/role.entity';
import { AddressInput } from 'src/utils/dtos/address.dto';
import { AddressColumn, NextOfKinColumn } from '../entities/user.entity';
import { BloodGroupEnum } from '../../utils/enums/bloodGroup.enum';
import { GenderEnum } from '../enum/gender.enum';
import { MaritalStatusEnum } from '../enum/maritalStatus.enum';
import { GenotypeEnum } from 'src/utils/enums/genotype.enum';

@InputType()
export class CreateNextOfKin {
  @Field(() => String, { description: 'first name field (placeholder)', nullable: false })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field(() => String, { description: 'last name field (placeholder)', nullable: false })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field(() => String, { description: 'middle name field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  middleName: string;

  @Field(() => String, { description: 'email field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'phone number field (placeholder)' })
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @Field(() => String, { description: 'address status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  address: string;

  @Field(() => String, { description: 'address status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  zipCode: string;

  @Field(() => String, { description: 'address status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  country: string;

  @Field(() => String, { description: 'address status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  relationship: string;

  @Field(() => String, { description: 'address status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  dateOfBirth: string;

  @Field(() => String, { description: 'address status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  state: string;

  @Field(() => String, { description: 'permanent address status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  city: string;
}


@InputType()
export class CreateUserInput {
  @Field(() => String, { description: 'first name field (placeholder)', nullable: false })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field(() => String, { description: 'last name field (placeholder)', nullable: false })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field(() => String, { description: 'middle name field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  middleName: string;

  @Field(() => Date, { description: 'date of birth field (placeholder)', nullable: true })
  @IsDate()
  @IsOptional()
  dateOfBirth: Date

  @Field(() => String, { description: 'email field (placeholder)', nullable: false })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'phone number field (placeholder)' })
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @Field(() => String, { description: 'otp field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  otp: string;

  @Field(() => String, { description: 'blood group field (placeholder)', nullable: true })
  @IsEnum(BloodGroupEnum)
  @IsOptional()
  bloodGroup: BloodGroupEnum;

  @Field(() => String, { description: 'blood group field (placeholder)', nullable: true })
  @IsEnum(GenotypeEnum)
  @IsOptional()
  genotype: GenotypeEnum;

  @Field(() => String, { description: 'marital status field (placeholder)', nullable: true })
  @IsEnum(MaritalStatusEnum)
  @IsOptional()
  maritalStatus: MaritalStatusEnum;

  @Field(() => String, { description: 'profile picture status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  profilePicture: string;

  @Field(() => String, { description: 'role field (placeholder)', nullable: false })
  @IsNotEmpty()
  role: Role;


  @Field(() => String, { description: 'religion status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  religion: string;

  @Field(() => String, { description: 'national"ity status field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  nationality: string;

  @Field(() => AddressInput, { description: 'address status field (placeholder)', nullable: true })
  @Type(() => AddressInput)
  @ValidateNested()
  @IsOptional()
  residentialAddress: AddressInput;

  @Field(() => AddressInput, { description: 'permanent address status field (placeholder)', nullable: true })
  @Type(() => AddressInput)
  @ValidateNested()
  @IsOptional()
  permanentAddress: AddressInput;

  @Field(() => CreateNextOfKin, { description: 'account status field (placeholder)', nullable: true })
  @Type(() => CreateNextOfKin)
  @ValidateNested()
  @IsOptional()
  nextOfKin: CreateNextOfKin;

  @Field(() => String, { description: 'gender status field (placeholder)', nullable: true })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender: GenderEnum;

  @Field(() => String, { description: 'role field (placeholder)', nullable: true })
  @IsOptional()

  designation?: Designation
}

