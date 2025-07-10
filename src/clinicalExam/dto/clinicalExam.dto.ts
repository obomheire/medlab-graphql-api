import { InputType, Field, PartialType, Float } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

@InputType()
export class SampleQuesInp {
  @Field(() => String)
  @IsString()
  longCase: string;

  @Field(() => String)
  @IsString()
  shortCase: string;
}

@InputType()
export class InstructionInp extends SampleQuesInp {}

@InputType()
export class ClinicalExamInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => Float)
  amount: number;

  @Field(() => String)
  about: string;

  @Field(() => String)
  markingScheme: string;

  @Field(() => SampleQuesInp)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SampleQuesInp)
  sampleQuestion: SampleQuesInp;
}

@InputType()
export class UpdateClinicalExamInput extends PartialType(ClinicalExamInput) {
  @Field(() => String)
  examUUID: string;
}

@InputType()
export class FaqInp {
  @Field(() => String)
  question: string;

  @Field(() => String)
  answer: string;
}

@InputType()
export class UpdateFaqInput extends PartialType(FaqInp) {
  @Field(() => String)
  faqUUID: string;
}
