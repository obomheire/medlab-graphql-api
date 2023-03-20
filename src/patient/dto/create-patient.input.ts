import { Optional } from '@nestjs/common';
import { InputType, Int, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, ValidateNested } from 'class-validator';
import { CreateNextOfKin } from 'src/user/dto/create-user.input';
import { MaritalStatusEnum } from 'src/user/enum/maritalStatus.enum';
import { AddressInput } from 'src/utils/dtos/address.dto';
import { BloodGroupEnum } from 'src/utils/enums/bloodGroup.enum';
import { GenotypeEnum } from 'src/utils/enums/genotype.enum';


@InputType()
export class CreatePatientInput {
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'first name field (placeholder)' })
  firstName: string

  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'last name field (placeholder)' })
  lastName: string

  @Field(() => String, { description: 'middle name field (placeholder)', nullable: true })
  @Optional()
  middleName?: string

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @Field(() => String, { description: 'email field (placeholder)', nullable: true })
  email?: string

  @IsString()
  @IsPhoneNumber()
  @Optional()
  @Field(() => String, { description: 'phone field (placeholder)', nullable: true })
  phoneNumber?: string

  @Field(() => AddressInput, { description: 'permanent address status field (placeholder)', nullable: true })
  @Type(() => AddressInput)
  @ValidateNested()
  @IsOptional()
  permanentAddress?: AddressInput;

  @Field(() => AddressInput, { description: 'address status field (placeholder)', nullable: true })
  @Type(() => AddressInput)
  @ValidateNested()
  @IsOptional()
  residentialAddress?: AddressInput;

  @Field(() => CreateNextOfKin, { description: 'account status field (placeholder)', nullable: true })
  @Type(() => CreateNextOfKin)
  @ValidateNested()
  @IsOptional()
  nextOfKin?: CreateNextOfKin;

  @Field(() => CreateNextOfKin, { description: 'account status field (placeholder)', nullable: true })
  @Type(() => CreateNextOfKin)
  @ValidateNested()
  @IsOptional()
  payerDetails?: CreateNextOfKin;

  @Field(() => String, { nullable: true})
  @IsString()
  @IsOptional()
  occupation: string

  @Field(() => String, { nullable: true})
  @IsString()
  @IsOptional()
  religion?: string

  @Field(() => String, { nullable: true})
  @IsString()
  @IsOptional()
  language?: string

  @Field(() => String, { nullable: true})
  @IsString()
  @IsOptional()
  dateOfBirth?: string

  @Field(() => String, { nullable: true})
  @IsString()
  @IsOptional()
  nationality?: string

  @Field(() => String, { nullable: true})
  @IsOptional()
  @IsEnum(GenotypeEnum)
  genotype?: GenotypeEnum

  @Field(() => String, { nullable: true})
  @IsOptional()
  @IsEnum(BloodGroupEnum)
  bloodGroup?: BloodGroupEnum

  @Field(() => String, { nullable: true})
  @IsOptional()
  @IsEnum(MaritalStatusEnum)
  maritalStatus?: MaritalStatusEnum
}
