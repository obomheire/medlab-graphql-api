import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PatientService } from '../service/patient.service';
import { Patient } from '../entities/patient.entity';
import { CreatePatientInput } from '../dto/create-patient.input';
import { UpdatePatientInput } from '../dto/update-patient.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { PatientResponse } from '../dto/patient-return.dto';
import { FilterDto } from 'src/utils/dtos/filter.dto';

@Resolver(() => Patient)
@UseGuards(GqlAuthGuard)
export class PatientResolver {
  constructor(private readonly patientService: PatientService) {}

  @Mutation(() => Patient)
  createPatient(@Args('createPatientInput') createPatientInput: CreatePatientInput) {
    return this.patientService.create(createPatientInput);
  }

  @Query(() => PatientResponse, { name: 'patients' })
  async findAll(@Args( 'filter',{defaultValue: new FilterDto()}) filter?: FilterDto): Promise<PatientResponse> {
    return await this.patientService.findAll(filter);
  }

  @Query(() => Patient, { name: 'patient' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.patientService.findOne(id);
  }

  @Mutation(() => String)
  deletePatient(@Args('id', { type: () => String }) id: string) {
    return this.patientService.remove(id);
  }

  @Mutation(() => Patient)
  updatePatient(@Args('updatePatientInput') updatePatientInput: UpdatePatientInput) {
    return this.patientService.update(updatePatientInput.id, updatePatientInput);
  }

  //create emergency patient
  @Mutation(() => Patient)
  createEmergencyPatient(@Args('createPatientInput') createPatientInput: CreatePatientInput) {
    return this.patientService.createEmergencyPatient(createPatientInput);
  }

  //get emergency patients
  @Query(() => [Patient], { name: 'emergencyPatients' })
  async getEmergencyPatients(@Args( 'filter',{defaultValue: new FilterDto()}) filter?: FilterDto): Promise<Patient[]> {
    return await this.patientService.getEmergencyPatients(filter);
  }

  //mark patient for discharge
  @Mutation(() => Patient)
  scheduleDischarge(@Args('id', { type: () => String }) id: string, @Args('dischargeDate', { type: () => Date}) dischargeDate: Date) {
    return this.patientService.markPatientForDischarge(id, dischargeDate);
  }

}
