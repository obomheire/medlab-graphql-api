import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Test } from 'src/laborataory/entities/test.entity';
import { User } from 'src/user/entities/user.entity';
import { Patient } from '../entities/patient.entity';
import { Visit } from '../entities/visit.entity';

@InputType()
export class InvestigationResult {
  @Field(() => String, {
    description: 'result field (placeholder)',
    nullable: true,
  })
  testHeading: string;

  @Field(() => String, {
    description: 'date field (placeholder)',
    nullable: true,
  })
  testParam: string;

  @Field(() => String, {
    description: 'date field (placeholder)',
    nullable: true,
  })
  testRes: string;
}

@InputType()
export class CreateInvestigationInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  notes: string;

  @Field(() => String, { nullable: false })
  @IsString()
  test: Test;

  @Field(() => String, { nullable: false })
  @IsString()
  patient: Patient;

  // @Field(() => String, { nullable: true })
  // @IsString()
  // @IsOptional()
  // doctor?: User;

  @Field(() => String)
  @IsString()
  visit: Visit;

  @Field(() => InvestigationResult, {
    description: 'account status field (placeholder)',
    nullable: true,
  })
  @Type(() => InvestigationResult)
  @ValidateNested()
  @IsOptional()
  result: InvestigationResult;
}
