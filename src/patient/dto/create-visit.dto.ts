import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { GenotypeEnum } from 'src/utils/enums/genotype.enum';
import { InvestigationEntity } from '../entities/investigation.entity';
import { PharmacyPrescription } from '../entities/prescription.entity';
import { AllergyLevelEnum } from '../enum/allergen-level.enum';

@InputType()
export class AllergyInput {
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'category field (placeholder)' })
  category: string;

  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'allergen field (placeholder)' })
  allergen: string;

  @IsEnum(AllergyLevelEnum)
  @IsOptional()
  @Field(() => String, { description: 'level field (placeholder)' })
  level: AllergyLevelEnum;

  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'reaction field (placeholder)' })
  reaction: string;
}

@InputType()
export class HealthRecordInput {
  @Field(() => String, {
    description: 'heart rate field (placeholder)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  heartRate: string;

  @Field(() => String, {
    description: 'blood pressure field (placeholder)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  bloodPressure: string;

  @Field(() => Int, {
    description: 'blood gluocose field (placeholder)',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  glucose: number;

  @Field(() => String, {
    description: 'genotype field (placeholder)',
    nullable: true,
  })
  @IsEnum(GenotypeEnum)
  @IsOptional()
  genotype: GenotypeEnum;

  @Field(() => Int, {
    description: 'temperature field (placeholder)',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  temperature: number;

  @Field(() => String, {
    description: 'note field (placeholder)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  note: string;

  @Field(() => String, {
    description: 'diagnosis field (placeholder)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  diagnosis: string;

  @Field(() => String, {
    description: 'weight field (placeholder)',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  weight: string;

  @Field(() => String, {
    description: 'height field (placeholder)',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  height: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  treatment: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  respiratoryRate: string;
}

@InputType()
export class AssessmentInput {
  @Field(() => String, {
    description: 'assessment field (placeholder)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  assessment: string;

  @Field(() => String, {
    description: 'plan field (placeholder)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  plan: string;

  @Field(() => String, {
    description: 'note field (placeholder)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  note: string;
}

@InputType()
export class DoctorNoteInput {
  @Field(() => String, {
    description: 'note field (placeholder)',
    nullable: true,
  })
  note: string;

  @Field(() => String, { nullable: true })
  treatment: string;

  @Field(() => String, { nullable: true })
  diagnosis: string;
}

@InputType()
export class RecomendationInput {
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'recomendation field (placeholder)' })
  recomendation: string;

  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'note field (placeholder)' })
  note: string;

  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'date field (placeholder)' })
  recommender: string;
}

@InputType()
export class CreateVisitInput {
  @Field(() => AllergyInput, {
    description: 'allergy field (placeholder)',
    nullable: true,
  })
  @Type(() => AllergyInput)
  @ValidateNested({ each: true })
  @IsOptional()
  allergy: AllergyInput[];

  @Field(() => HealthRecordInput, {
    description: 'vital signs field (placeholder)',
    nullable: true,
  })
  @Type(() => HealthRecordInput)
  @ValidateNested({ each: true })
  @IsOptional()
  vitalSigns: HealthRecordInput;

  @Field(() => AssessmentInput, {
    description: 'assessment log field (placeholder)',
    nullable: true,
  })
  @Type(() => AssessmentInput)
  @ValidateNested({ each: true })
  @IsOptional()
  assessmentLog: AssessmentInput;

  @Field(() => RecomendationInput, {
    description: 'recommendation field (placeholder)',
    nullable: true,
  })
  @Type(() => RecomendationInput)
  @ValidateNested({ each: true })
  @IsOptional()
  recommendation: RecomendationInput;

  @Field(() => DoctorNoteInput, {
    description: 'docotor note field (placeholder)',
    nullable: true,
  })
  @Type(() => DoctorNoteInput)
  @ValidateNested({ each: true })
  @IsOptional()
  doctorNote: DoctorNoteInput;

  @Field(() => String, {
    description: 'visit note field (placeholder)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  visitNote: string;

  @Field(() => String, {
    description: 'patient field (placeholder)',
    nullable: false,
  })
  @IsString()
  @IsOptional()
  patient: string;

  @IsArray()
  @IsOptional()
  @Field(() => [String], {
    description: 'prescription field (placeholder)',
    nullable: true,
  })
  prescriptions: PharmacyPrescription[];

  @IsArray()
  @IsOptional()
  @Field(() => [String], {
    description: 'investigation field (placeholder)',
    nullable: true,
  })
  investigations: InvestigationEntity[];
}

@InputType()
export class UpdateVisitInput extends PartialType(CreateVisitInput) {
  @Field(() => String, { nullable: true})
  id: string;
}

