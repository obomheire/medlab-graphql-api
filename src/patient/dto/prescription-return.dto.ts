import { Field, Int, ObjectType } from "@nestjs/graphql";
import { PharmacyPrescription } from "../entities/prescription.entity";

@ObjectType()
export class PrescriptionResponse {
    @Field(() => [PharmacyPrescription], { nullable: true })
    prescriptions: PharmacyPrescription[];
    @Field(() => Int, { nullable: true })
    count: number;
    @Field(() => Int, { nullable: true })
    currentPage: number;
    @Field(() => Int, { nullable: true })
    totalPages: number;
  }