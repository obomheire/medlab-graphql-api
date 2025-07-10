import { InputType, Field, PartialType, ArgsType } from '@nestjs/graphql';
import { IsEnum, IsString, IsOptional, Matches } from 'class-validator';
import { CaseType, GenderType } from '../enum/clinicalExam.enum';
import { PaginationArgs } from 'src/quiz/dto/question.input';
import { Type } from 'class-transformer';

@InputType()
export class ExaminerInp {
  @Field(() => String)
  agentId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  image: string;

  @Field(() => String)
  voice: string;

  @Field(() => String)
  gender: string;
}

@InputType()
export class ExaminerInput {
  @Field(() => ExaminerInp)
  examiner1: ExaminerInp;

  @Field(() => ExaminerInp)
  examiner2: ExaminerInp;
}

@InputType()
export class PatientProfileInp {
  @Field(() => String)
  name: string;

  @Field(() => String)
  @Matches(/^\d{2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}$/, {
    message: 'DOB must be in the format DD-MMM-YYYY (e.g., 01-Jan-1975)',
  })
  dob: string;

  @Field(() => Number)
  age: number;

  @Field(() => String)
  @IsEnum(GenderType)
  gender: GenderType;

  @Field(() => String)
  ethnicity: string;

  @Field(() => String)
  image: string;

  @Field(() => String, { nullable: true })
  agentId: string;
}

@InputType()
export class PractCaseCatInp {
  @Field(() => String)
  practCaseUUID: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  caseNo: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String)
  time: string;

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => String)
  patientOverview: string;

  @Field(() => String, { nullable: true })
  medications: string;

  @Field(() => PatientProfileInp)
  @Type(() => PatientProfileInp)
  patientProfile: PatientProfileInp;

  @Field(() => ExaminerInput, { nullable: true })
  @Type(() => ExaminerInput)
  examiners: ExaminerInput;

  @Field(() => String, { nullable: true })
  physicalExam: string;

  @Field(() => String)
  @IsEnum(CaseType)
  caseType: CaseType;
}

@InputType()
export class UpdatePractCaseCatInp extends PartialType(PractCaseCatInp) {
  @Field(() => String)
  practCaseCatUUID: string;
}

@ArgsType()
export class PractCaseCatsArgs extends PaginationArgs {
  @Field(() => String)
  practCaseUUID: string;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsEnum(CaseType)
  caseType: CaseType;
}
