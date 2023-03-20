import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DrugFrequencyEnum } from '../enum/drug-frequency.enum';
import { FoodRelationEnum } from '../enum/food-relation.enum';
import { PrescriptionStatusEnum } from '../enum/prescription-status.enum';
import { RouteOfAdminEnum } from '../enum/route-admin.enum';
import { Patient } from './patient.entity';
import { Visit } from './visit.entity';

@ObjectType()
export class PrescriptionUnit {
  @Field(() => String, {
    description: 'product field (placeholder)',
    nullable: false,
  })
  product: string;

  @Field(() => String, {
    description: 'strength field (placeholder)',
    nullable: false,
  })
  notes: string;

  @Field(() => String, {
    description: 'unit field (placeholder)',
    nullable: false,
  })
//   @Column( { type: 'enum', enum: DrugFrequencyEnum, nullable: true})
  frequency: DrugFrequencyEnum;

  @Field(() => String, {
    description: 'route of admin (placeholder)',
    nullable: false,
  })
//   @Column({ type: 'enum', enum: RouteOfAdminEnum, nullable: true})
  routeOfAdmin: RouteOfAdminEnum;

  @Field(() => Int, {
    description: 'duration field (placeholder)',
    nullable: false,
  })
  duration: number;

  @Field(() => Int, {
    description: 'quantity field (placeholder)',
    nullable: false,
  })
  quantity: Number;

//   @Field(() => String, {
//     description: 'strength field (placeholder)',
//     nullable: false,
//   })
// //   @Column( { type: 'enum', enum: FoodRelationEnum, nullable: true})
//   foodRelation: FoodRelationEnum;
}

@ObjectType()
@Entity()
export class PharmacyPrescription {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'id field (placeholder)' })
  id: string;

  @Field(() => [PrescriptionUnit], { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  items: PrescriptionUnit[];

  @Field(() => String, { nullable: false })
    @Column({ nullable: false })
    uniqueCode: string;

    @Field(() => String)
    @Column({ type: 'enum', enum: PrescriptionStatusEnum, default: PrescriptionStatusEnum.PENDING })
    status: PrescriptionStatusEnum;

    @Field(() => Int, { nullable: true })
    @Column({ nullable: true })
    totalCost: number;

    @Field(() => Boolean, { nullable: true })
    @Column({ default: false })
    isPaid: boolean;

    @Field(() => Boolean, { nullable: true })
    @Column({ default: false })
    isRefill: boolean;

    @Field(() => Boolean, { nullable: true })
    @Column({ default: false })
    isDispensed: boolean;

    @ManyToOne(() => Patient, (patient) => patient.prescriptions)
    @Field(() => String, { description: 'patient field (placeholder)' })
    patient: Patient;

    @ManyToOne(() => Visit, (visit) => visit.prescriptions)
    @Field(() => String, { description: 'patient field (placeholder)' })
    visit: Visit;

    @ManyToOne(() => User, (doctor) => doctor.prescriptions)
    @Field(() => String, { description: 'doctor field (placeholder)' })
    doctor: User;

    @CreateDateColumn()
    @Field(() => Date, { description: 'date field (placeholder)' })
    createdAt: Date;

    @UpdateDateColumn()
    @Field(() => Date, { description: 'date field (placeholder)' })
    updatedAt: Date;

}
