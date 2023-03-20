import { Module } from '@nestjs/common';
import { PatientService } from './service/patient.service';
import { PatientResolver } from './resolver/patient.resolver';
import { Patient } from './entities/patient.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestigationEntity } from './entities/investigation.entity';
import { Visit } from './entities/visit.entity';
import { PharmacyPrescription } from './entities/prescription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient]), TypeOrmModule.forFeature([InvestigationEntity]), TypeOrmModule.forFeature([PharmacyPrescription]), TypeOrmModule.forFeature([Visit])],
  providers: [PatientResolver, PatientService]
})
export class PatientModule {}
