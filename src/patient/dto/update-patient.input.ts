import { CreatePatientInput } from './create-patient.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdatePatientInput extends PartialType(CreatePatientInput) {
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true})
  id: string;
}
