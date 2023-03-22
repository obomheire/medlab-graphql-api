import { Field, ObjectType } from '@nestjs/graphql';
import { Test } from '../../laborataory/entities/test.entity';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvestigationStatusEnum } from '../enum/investigation-status.enum';
import { Patient } from './patient.entity';
import { Visit } from './visit.entity';

@ObjectType()
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

  @Field(() => String, {
    description: 'date field (placeholder)',
    nullable: true,
  })
  doneBy: User;

  @Field(() => String, {
    description: 'date field (placeholder)',
    nullable: true,
  })
  doneAt: Date;
}

@ObjectType()
@Entity()
export class InvestigationEntity {
  @Field(() => String, { description: 'id field (placeholder)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: 'date field (placeholder)' })
  @ManyToOne(() => Test, (test) => test.investigations)
  test: Test;

  @Field(() => String, {
    description: 'date field (placeholder)',
    nullable: true,
  })
  @ManyToOne(() => User, (doctor) => doctor.investigations, { nullable: true })
  doctor: User;

  @ManyToOne(() => Patient, (patient) => patient.investigations)
  @Field(() => String, { description: 'patient field (placeholder)' })
  patient: Patient;

  @ManyToOne(() => Visit, (visit) => visit.investigations)
  @Field(() => String, { description: 'patient field (placeholder)' })
  visit: Visit;

  @Column('varchar', { name: 'notes', nullable: true, length: 255 })
  @Field(() => String, {
    description: 'unit field (placeholder)',
    nullable: true,
  })
  notes: string | null;

  @Column({ name: 'code', nullable: false, unique: true })
  @Field(() => String, {
    description: 'unit field (placeholder)',
    nullable: false,
  })
  uniqueCode: string;

  //   @Column('varchar', { name: 'normal_range', nullable: true, length: 255 })
  //   normalRange: string | null;

  //   @Column('varchar', { name: 'reference_range', nullable: true, length: 255 })
  //   referenceRange: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    type: 'enum',
    name: 'status',
    enum: InvestigationStatusEnum,
    default: InvestigationStatusEnum.PENDING,
  })
  investigationStatus: InvestigationStatusEnum;

  @Field(() => InvestigationResult, { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  result: InvestigationResult;

  @CreateDateColumn()
  @Field(() => Date, { description: 'date field (placeholder)' })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { description: 'date field (placeholder)' })
  updatedAt: Date;
}
