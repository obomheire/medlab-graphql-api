import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  AddressColumn,
  NextOfKinColumn,
} from '../../user/entities/user.entity';
import { BloodGroupEnum } from '../../utils/enums/bloodGroup.enum';
import { MaritalStatusEnum } from '../../user/enum/maritalStatus.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdmissionStatusEnum } from '../enum/admission-status.enum';
import { GenotypeEnum } from '../../utils/enums/genotype.enum';
import { InvestigationEntity } from './investigation.entity';
import { Visit } from './visit.entity';
import { PharmacyPrescription } from './prescription.entity';

@ObjectType()
@Entity()
export class Patient {
  @Field(() => String, { description: 'Example field (placeholder)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: 'first name field (placeholder)' })
  @Column({ type: 'varchar', length: 255, nullable: false })
  firstName: string;

  @Field(() => String, { description: 'last name field (placeholder)' })
  @Column({ type: 'varchar', length: 255, nullable: false })
  lastName: string;

  @Field(() => String, {
    description: 'middle name field (placeholder)',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  middleName: string;

  @Field(() => String, { description: 'email field (placeholder)' })
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Field(() => String, {
    description: 'phone field (placeholder)',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  phoneNumber: string;

  @Field(() => AddressColumn, { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  residentialAddress?: AddressColumn;

  @Field(() => AddressColumn, { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  permanentAddress?: AddressColumn;

  @Field(() => NextOfKinColumn, { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  nextOfKin?: NextOfKinColumn;

  @Field(() => NextOfKinColumn, { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  payerDetails?: NextOfKinColumn;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  religion: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  occupation: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: AdmissionStatusEnum,
    default: AdmissionStatusEnum.OUTPATIENT,
  })
  admissionStatus: AdmissionStatusEnum;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  language: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'enum', nullable: true, enum: BloodGroupEnum })
  bloodGroup: BloodGroupEnum;

  @Field(() => String, { nullable: true })
  @Column({ type: 'enum', nullable: true, enum: GenotypeEnum })
  genotype: GenotypeEnum;

  @Field(() => String, { nullable: false })
  @Column({ nullable: false })
  unique: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  reasonForDeath: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  dateOfBirth: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  nationality: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  profilePicture: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'enum', enum: MaritalStatusEnum })
  maritalStatus: MaritalStatusEnum;

  @Field(() => [String], { nullable: true })
  @Column({ nullable: true, type: 'simple-array' })
  dischargeDates: string[];

  @Field(() => [String], { nullable: true })
  @Column({ nullable: true, type: 'simple-array' })
  admissionDates: string[];

  @Field(() => [String], { nullable: true })
  @OneToMany(
    () => InvestigationEntity,
    (investigations) => investigations.patient,
  )
  investigations: InvestigationEntity[];

  @OneToMany(
    () => PharmacyPrescription,
    (prescriptions) => prescriptions.patient,
    { nullable: true },
  )
  @Field(() => [PharmacyPrescription], { nullable: true })
  prescriptions: PharmacyPrescription[];

  @OneToMany(() => Visit, (visits) => visits.patient, { nullable: true })
  @Field(() => [String], { nullable: true })
  visits: Visit[];

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  static getAge(dateOfBirth: string) {
    if (dateOfBirth) {
      const date = new Date(dateOfBirth);
      const ageDifMs = Date.now() - date.getTime();
      const ageDate = new Date(ageDifMs); // miliseconds from epoch
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    return null;
  }
}
