import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AccountStatusEnum } from '../enum/accountStatus.enum';
import { BloodGroupEnum } from '../../utils/enums/bloodGroup.enum';
import { GenderEnum } from '../enum/gender.enum';
import { MaritalStatusEnum } from '../enum/maritalStatus.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { Role } from '../../role/entities/role.entity';
import { Designation } from '../../role/entities/designation.entity';
import { InvestigationEntity } from '../../patient/entities/investigation.entity';
import { PharmacyPrescription } from '../../patient/entities/prescription.entity';
import { GenotypeEnum } from '../../utils/enums/genotype.enum';
import { Visit } from '../../patient/entities/visit.entity';

@ObjectType()
export class AddressColumn {
  @Field(() => String, {
    description: 'address status field (placeholder)',
    nullable: true,
  })
  street: string;
  @Field(() => String, {
    description: 'city field (placeholder)',
    nullable: true,
  })
  city: string;
  @Field(() => String, {
    description: 'state field (placeholder)',
    nullable: true,
  })
  state: string;
  @Field(() => String, {
    description: 'zip status field (placeholder)',
    nullable: true,
  })
  zip: string;
  @Field(() => String, {
    description: 'telephone field (placeholder)',
    nullable: true,
  })
  telephone: string;
  @Field(() => String, {
    description: 'country field (placeholder)',
    nullable: true,
  })
  country: string;
}

@ObjectType()
export class NextOfKinColumn {
  @Field(() => String, {
    description: 'first name field (placeholder)',
    nullable: true,
  })
  firstName: string;
  @Field(() => String, {
    description: 'last name field (placeholder)',
    nullable: true,
  })
  lastName: string;
  @Field(() => String, {
    description: 'middle name field (placeholder)',
    nullable: true,
  })
  middleName: string;
  @Field(() => String, {
    description: 'email field (placeholder)',
    nullable: true,
  })
  email: string;
  @Field(() => String, {
    description: 'phone number field (placeholder)',
    nullable: true,
  })
  phoneNumber: string;
  @Field(() => String, {
    description: 'address status field (placeholder)',
    nullable: true,
  })
  address: string;
  @Field(() => String, {
    description: 'zip code status field (placeholder)',
    nullable: true,
  })
  zipCode: string;
  @Field(() => String, {
    description: 'country field (placeholder)',
    nullable: true,
  })
  country: string;
  @Field(() => String, {
    description: 'relationship field (placeholder)',
    nullable: true,
  })
  relationship: string;
  @Field()
  dateOfBirth: string;
  @Field()
  state: string;
}

@Entity()
@ObjectType()
export class User {
  @Field(() => String, { description: 'id field (placeholder)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, {
    description: 'first name field (placeholder)',
    nullable: false,
  })
  @Column({ nullable: false })
  firstName: string;

  @Field(() => String, {
    description: 'last name field (placeholder)',
    nullable: false,
  })
  @Column({ nullable: false })
  lastName: string;

  @Field(() => String, {
    description: 'last name field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true })
  middleName: string;

  @Field(() => Date, {
    description: 'date of birth field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true })
  dateOfBirth: Date;

  @Field(() => String, {
    description: 'email field (placeholder)',
    nullable: false,
  })
  @Column({ unique: true, nullable: false })
  email: string;

  @Field(() => String, { description: 'password field (placeholder)' })
  @Column({ nullable: false })
  password: string;

  @Field(() => String, {
    description: 'phone number field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @Field(() => String, {
    description: 'otp field (placeholder)',
    nullable: true,
  })
  @Column({ nullable: true })
  otp: string;

  @CreateDateColumn()
  @Field(() => Date, { description: 'created at field (placeholder)' })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { description: 'updated at field (placeholder)' })
  updatedAt: Date;

  @Field(() => AddressColumn, { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  residentialAddress?: AddressColumn;

  @Field(() => AddressColumn, { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  permanentAddress?: AddressColumn;

  @Field(() => NextOfKinColumn, { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  nextOfKin?: NextOfKinColumn;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  religion: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'enum', nullable: true, enum: GenderEnum })
  gender: GenderEnum;

  @Field(() => String, {
    nullable: true,
    description: 'blood group field (placeholder)',
  })
  @Column({ type: 'enum', nullable: true, enum: BloodGroupEnum })
  bloodGroup: BloodGroupEnum;

  @Field(() => String, {
    nullable: true,
    description: 'genotype field (placeholder)',
  })
  @Column({ type: 'enum', nullable: true, enum: GenotypeEnum })
  genotype: GenotypeEnum;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  nationality: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  profilePicture: string;

  @Field({ nullable: false })
  @Column({ nullable: false, unique: true })
  unique: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'enum', nullable: true, enum: MaritalStatusEnum })
  maritalStatus: MaritalStatusEnum;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  refreshToken: string;

  @Field(() => Role, { nullable: false })
  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @Field(() => Designation, { nullable: true })
  @ManyToOne(() => Designation, (designation) => designation.users, {
    nullable: true,
  })
  designation: Designation;

  @Field(() => [String], { nullable: true })
  @OneToMany(
    () => InvestigationEntity,
    (investigations) => investigations.doctor,
    { nullable: true },
  )
  investigations: InvestigationEntity[];

  @OneToMany(
    () => PharmacyPrescription,
    (prescriptions) => prescriptions.doctor,
    { nullable: true },
  )
  @Field(() => [PharmacyPrescription], { nullable: true })
  prescriptions: PharmacyPrescription[];

  @OneToMany(() => Visit, (visits) => visits.doctor, { nullable: true })
  @Field(() => [Visit], { nullable: true })
  visits: Visit[];

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: AccountStatusEnum,
    default: AccountStatusEnum.INACTIVE,
  })
  accountStatus: AccountStatusEnum;

  // @BeforeInsert()
  // async hashPasswordBeforeInsert() {
  //   this.password = await User.hashPassword(this.password);
  // }

  @Field(() => Boolean)
  @Column({ default: false })
  isFree: boolean;

  static async hashPassword(pass: string): Promise<string> {
    try {
      // const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(pass, 10);
      return password;
    } catch (error) {
      throw new InternalServerErrorException('Error while hashing password');
    }
  }

  async validatePassword(pass: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(pass, this.password);
      return isMatch;
      console.log(isMatch);
    } catch (error) {
      throw new InternalServerErrorException('Error while validating password');
    }
  }

  //we want to return a user without the password
  toResponseObject() {
    const {
      id,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      email,
      phoneNumber,
      residentialAddress,
      permanentAddress,
      nextOfKin,
      religion,
    } = this;
    const responseObject = {
      id,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      email,
      phoneNumber,
      residentialAddress,
      permanentAddress,
      nextOfKin,
      religion,
    };
    return responseObject;
  }

  //we want to  obtain the age from the dateofBirth field and compare to present date
  getAge() {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  //we want to obtain the full name of the user
  getFullName() {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
}
