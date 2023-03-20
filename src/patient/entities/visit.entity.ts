import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GenotypeEnum } from '../../utils/enums/genotype.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AllergyLevelEnum } from '../enum/allergen-level.enum';
import { InvestigationEntity } from './investigation.entity';
import { Patient } from './patient.entity';
import { PharmacyPrescription } from './prescription.entity';
import { User } from '../../user/entities/user.entity';

@ObjectType()
export class Allergy {
  @Field(() => String, { description: 'category field (placeholder)' })
  category: string;

  @Field(() => String, { description: 'allergen field (placeholder)' })
  allergen: string;

  @Field(() => String, { description: 'level field (placeholder)', nullable: true })
  // @Column({ type: 'enum', enum: AllergyLevelEnum, nullable: true })
  level: AllergyLevelEnum;

  @Field(() => String, { description: 'reaction field (placeholder)' })
  reaction: string;
}

@ObjectType()
export class HealthRecord {
  @Field(() => String, {
    description: 'heart rate field (placeholder)',
    nullable: true,
  })
  heartRate: string;

  @Field(() => String, {
    description: 'blood pressure field (placeholder)',
    nullable: true,
  })
  bloodPressure: string;

  @Field(() => Int, {
    description: 'blood gluocose field (placeholder)',
    nullable: true,
  })
  glucose: number;

  @Field(() => String, {
    description: 'genotype field (placeholder)',
    nullable: true,
  })
  // @Column({ type: 'enum', enum: GenotypeEnum, nullable: true })
  genotype: GenotypeEnum;

  @Field(() => Int, {
    description: 'temperature field (placeholder)',
    nullable: true,
  })
  temperature: number;

  @Field(() => String, {
    description: 'note field (placeholder)',
    nullable: true,
  })
  note: string;

  @Field(() => String, {
    description: 'diagnosis field (placeholder)',
    nullable: true,
  })
  diagnosis: string;

  @Field(() => String, {
    description: 'weight field (placeholder)',
    nullable: true,
  })
  weight: string;

  @Field(() => String, {
    description: 'height field (placeholder)',
    nullable: true,
  })
  height: string;

  @Field(() => String, { nullable: true })
  treatment: string;

  @Field(() => String, { nullable: true })
  respiratoryRate: string;
}

@ObjectType()
export class Assessment {
  @Field(() => String, {
    description: 'assessment field (placeholder)',
    nullable: true,
  })
  assessment: string;

  @Field(() => String, {
    description: 'plan field (placeholder)',
    nullable: true,
  })
  plan: string;

  @Field(() => String, {
    description: 'note field (placeholder)',
    nullable: true,
  })
  note: string;
}

@ObjectType()
export class DoctorNote {
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

@ObjectType()
export class Recomendation {
  @Field(() => String, { description: 'recomendation field (placeholder)' })
  recomendation: string;

  @Field(() => String, { description: 'note field (placeholder)' })
  note: string;

  @Field(() => String, { description: 'date field (placeholder)', nullable: true })
  recommender: string;
}

@ObjectType()
@Entity()
export class Visit {
  @Field(() => String, { description: 'id field (placeholder)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column({ nullable: false, unique: true })
  uniqueCode: string;

  @Field(() => String, {
    description: 'visit note field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true })
  visitNote: string;

  @Field(() => [Allergy], {
    description: 'visit date field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true, type: 'json' })
  allergy: Allergy[];

  @Field(() => HealthRecord, {
    description: 'health record field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true, type: 'json' })
  vitalSigns: HealthRecord;

  @Field(() => Assessment, {
    description: 'visit date field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true, type: 'json' })
  assessmentLog: Assessment;

  @Field(() => Recomendation, {
    description: 'visit date field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true , type: 'json' })
  recommendation: Recomendation;

  @Field(() => DoctorNote, {
    description: 'visit date field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true, type: 'json' })
  doctorNote: DoctorNote;

  @ManyToOne(() => Patient, (patient) => patient.visits)
  @Field(() => String, { description: 'patient field (placeholder)' })
  patient: string

  @ManyToOne(() => User, (doctor) => doctor.visits)
  @Field(() => String, { description: 'doctor field (placeholder)' })
  doctor: string

  @Field(() => [String], { nullable: true })
  @OneToMany(
    () => InvestigationEntity,
    (investigations) => investigations.visit,
    { nullable: true },
  )
  investigations: InvestigationEntity[];
 
  @Field(() => [String], { nullable: true })
  @OneToMany(() => PharmacyPrescription, (prescriptions) => prescriptions.visit, { nullable: true })
  prescriptions: PharmacyPrescription[];

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: string;
}
