import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Patient } from "../entities/patient.entity";

@ObjectType()
export class PatientResponse {
    @Field(() => [Patient], { nullable: true })
    patients: Patient[];
    @Field(() => Int, { nullable: true })
    count: number;
    @Field(() => Int, { nullable: true })
    currentPage: number;
    @Field(() => Int, { nullable: true })
    totalPages: number;
  }