import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { generateIncrementalValue } from 'src/utils/functions/generateValue';
import { Between, Repository } from 'typeorm';
import { CreatePatientInput } from '../dto/create-patient.input';
import { PatientResponse } from '../dto/patient-return.dto';
import { UpdatePatientInput } from '../dto/update-patient.input';
import { Patient } from '../entities/patient.entity';
import { FilterDto } from 'src/utils/dtos/filter.dto';
import { AdmissionStatusEnum } from '../enum/admission-status.enum';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  //create patient, and assign him a unique using generateIncrementalValue function
  create = async (createPatientInput: CreatePatientInput): Promise<Patient> => {
    try {
      const patient = this.patientRepository.create(createPatientInput);
      //assign unique
      const serialNumber = await generateIncrementalValue(this.patientRepository);
      const unique = `PAT-${serialNumber}`;

      patient.unique = unique
      return await this.patientRepository.save(patient);
    } catch (error) {
      throw error;
    }
  };

  //update patient. YOU CAN NOT UPDATE THE UNIQUE VALUE
  update = async (
    id: string,
    updatePatientInput: UpdatePatientInput,
  ): Promise<Patient> => {
    try {
      const patient = await this.patientRepository.findOneOrFail({
        where: { id },
      });
      if (!patient) throw new Error('Patient not found');
      return await this.patientRepository.save({
        ...patient,
        ...updatePatientInput,
      });
    } catch (error) {
      throw error;
    }
  };

  //delete patient
  remove = async (id: string): Promise<string> => {
    try {
      const patient = await this.patientRepository.findOneOrFail({
        where: { id },
      });
      if (!patient) throw new Error('Patient not found');
      await this.patientRepository.remove(patient);
      return 'Patient deleted successfully';
    } catch (error) {
      throw error;
    }
  };

  //get single patient
  findOne = async (id: string): Promise<Patient> => {
    try {
      return await this.patientRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      throw error;
    }
  };

  findAll = async (filterDto?: FilterDto): Promise<PatientResponse> => {
    try {
      this.logger.log(`findAll:patient`);
      let { page, limit, search, startDate, endDate } = filterDto;
      const skip = (page - 1) * limit;
      const query = this.patientRepository
        .createQueryBuilder('patient')

        .orderBy('patient.createdAt', 'DESC');

      if (search || startDate) {
        let whereConditions = [];
        let whereParams: any = {};

        if (search) {
          whereConditions.push(
            'patient.firstName LIKE :search OR patient.lastName LIKE :search OR patient.email LIKE :search OR patient.unique LIKE :search OR patient.phoneNumber LIKE :search',
          );
          whereParams.search = `%${search}%`;
        }

        let end: any;
        if (startDate) {
          if (endDate === undefined) {
            end = new Date(startDate)
              .toISOString()
              .replace(/T.*/, 'T23:59:59.999Z');
          }

          if (filterDto.endDate) {
            end = new Date(filterDto.endDate)
              .toISOString()
              .replace(/T.*/, 'T23:59:59.999Z');
          }
          //if endDate is less than startDate, throw error
          if (end < startDate) {
            throw new BadRequestException(
              'End date cannot be less than start date',
            );
          }
          whereConditions.push('patient.createdAt BETWEEN :startDate AND :end');
          whereParams.startDate = startDate;
          whereParams.end = end;
        }

        query.andWhere(whereConditions.join(' AND '), whereParams);
      }

      const [patients, count] = await query
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(count / limit);

      return { patients, count, currentPage: page, totalPages };
    } catch (error) {
      this.logger.error(`findAll:patient:error:${error.message}`);
      throw error;
    }
  };

  //create emergency patient and assign him a unique using generateIncrementalValue function
  createEmergencyPatient = async (
    createPatientInput: CreatePatientInput,
  ): Promise<Patient> => {
    try {
      const patient = this.patientRepository.create(createPatientInput);
      //assign unique
      patient.admissionStatus = AdmissionStatusEnum.EMERGENCY;
      const serialNumber = await generateIncrementalValue(this.patientRepository);
      const unique = `PAT-${serialNumber}`;
      patient.unique = unique;
      return await this.patientRepository.save(patient);
    } catch (error) {
      throw error;
    }
  };

  //get emergency patients and filter them between two dates if provided
  getEmergencyPatients = async (data?: FilterDto): Promise<Patient[]> => {
    try {
      const { startDate, endDate, search } = data;
      let patients: Patient[];
      if (startDate) {
        const start: any = new Date(startDate)
          .toISOString()
          .replace(/T.*/, 'T00:00:00.000Z');
        const end = endDate
          ? new Date(endDate).toISOString().replace(/T.*/, 'T23:59:59.999Z')
          : new Date(startDate).toISOString().replace(/T.*/, 'T23:59:59.999Z');
        patients = await this.patientRepository.find({
          where: {
            admissionStatus: AdmissionStatusEnum.EMERGENCY,
            createdAt: Between(start, end),
          },
        });
      } else {
        patients = await this.patientRepository.find({
          where: { admissionStatus: AdmissionStatusEnum.EMERGENCY },
        });
      }
      if(search) {
        patients = patients.filter(patient => {
          return patient.firstName.toLowerCase().includes(search.toLowerCase()) || patient.lastName.toLowerCase().includes(search.toLowerCase()) || patient.email.toLowerCase().includes(search.toLowerCase()) || patient.unique.toLowerCase().includes(search.toLowerCase()) || patient.phoneNumber.toLowerCase().includes(search.toLowerCase())
        })
      }
      return patients;
    } catch (error) {
      throw error;
    }
  };

  //get patient count overall or filter the count between two dates if provided
  getPatientCount = async (start?: Date, end?: Date): Promise<number> => {
    try {
      let count: number;
      if (start) {
        const startDate: any = new Date(start)
          .toISOString()
          .replace(/T.*/, 'T00:00:00.000Z');
        const endDate = end
          ? new Date(end).toISOString().replace(/T.*/, 'T23:59:59.999Z')
          : new Date(start).toISOString().replace(/T.*/, 'T23:59:59.999Z');
        count = await this.patientRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        });
      } else {
        count = await this.patientRepository.count();
      }
      return count;
    } catch (error) {
      throw error;
    }
  };

  //get mortality rate
  getMortalityRate = async (start?: Date, end?: Date): Promise<any> => {
    try {
      let count: number;
      if (start) {
        const startDate: any = new Date(start)
          .toISOString()
          .replace(/T.*/, 'T00:00:00.000Z');
        const endDate = end
          ? new Date(end).toISOString().replace(/T.*/, 'T23:59:59.999Z')
          : new Date(start).toISOString().replace(/T.*/, 'T23:59:59.999Z');
        count = await this.patientRepository.count({
          where: {
            admissionStatus: AdmissionStatusEnum.DEAD,
            createdAt: Between(startDate, endDate),
          },
        });
      } else {
        count = await this.patientRepository.count({
          where: { admissionStatus: AdmissionStatusEnum.DEAD },
        });
      }
      const patientCount = await this.patientRepository.count();
      const mortalityRate = (count / patientCount) * 100;
      return { rate: mortalityRate, count };
    } catch (error) {
      throw error;
    }
  };

  //filter patients by admission status
  filterByAdmissionStatus = async (
    admissionStatus: AdmissionStatusEnum,
  ): Promise<Patient[]> => {
    try {
      const patients = await this.patientRepository.find({
        where: { admissionStatus },
      });
      return patients;
    } catch (error) {
      throw error;
    }
  };

  //get patient count and details between two dates
  getPatientCountBetweenDates = async (
    start: Date,
    end?: Date,
  ): Promise<any> => {
    try {
      const startDate: any = new Date(start)
        .toISOString()
        .replace(/T.*/, 'T00:00:00.000Z');
      const endDate: any = end
        ? new Date(end).toISOString().replace(/T.*/, 'T23:59:59.999Z')
        : new Date(start).toISOString().replace(/T.*/, 'T23:59:59.999Z');
      const patients = await this.patientRepository.find({
        where: { createdAt: Between(startDate, endDate) },
      });
      const count = patients.length;
      return { count, patients };
    } catch (error) {
      throw error;
    }
  };

  // get admitted patient count and details between two dates
  getAdmittedPatientCountBetweenDates = async (
    start: Date,
    end?: Date,
  ): Promise<any> => {
    try {
      const startDate: any = new Date(start)
        .toISOString()
        .replace(/T.*/, 'T00:00:00.000Z');
      const endDate: any = end
        ? new Date(end).toISOString().replace(/T.*/, 'T23:59:59.999Z')
        : new Date(start).toISOString().replace(/T.*/, 'T23:59:59.999Z');
      const patients = await this.patientRepository.find({
        where: {
          admissionStatus: AdmissionStatusEnum.ADMITTED,
          createdAt: Between(startDate, endDate),
        },
      });
      const count = patients.length;
      return { count, patients };
    } catch (error) {
      throw error;
    }
  };

  //get discharged patient count and details between two dates
  getDischargedPatientCountBetweenDates = async (
    start: Date,
    end?: Date,
  ): Promise<any> => {
    try {
      const startDate: any = new Date(start)
        .toISOString()
        .replace(/T.*/, 'T00:00:00.000Z');
      const endDate: any = end
        ? new Date(end).toISOString().replace(/T.*/, 'T23:59:59.999Z')
        : new Date(start).toISOString().replace(/T.*/, 'T23:59:59.999Z');
      const patients = await this.patientRepository.find({
        where: {
          admissionStatus: AdmissionStatusEnum.DISCHARGED,
          createdAt: Between(startDate, endDate),
        },
      });
      const count = patients.length;
      return { count, patients };
    } catch (error) {
      throw error;
    }
  };

  //get pending discharge list between  and if dates, filter if provided and be able to search by patient firstname, lastname, unique, phone number
  getPendingDischargeList = async (
    data?: FilterDto,
  ): Promise<PatientResponse> => {
    const { startDate, endDate, search, page, limit } = data;
    //and we want to pick the last added date into the dischargeDates and display it as the discharge date
    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.admissionStatus = :admissionStatus', {
        admissionStatus: AdmissionStatusEnum.PENDING,
      })
      .orderBy('patient.dischargeDates', 'DESC')
      .addOrderBy('patient.createdAt', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit);
    if (startDate) {
      const start: any = new Date(startDate)
        .toISOString()
        .replace(/T.*/, 'T00:00:00.000Z');
      const end: any = endDate
        ? new Date(endDate).toISOString().replace(/T.*/, 'T23:59:59.999Z')
        : new Date(startDate).toISOString().replace(/T.*/, 'T23:59:59.999Z');
      queryBuilder.andWhere('patient.createdAt BETWEEN :start AND :end', {
        start,
        end,
      });
    }
    if (search) {
      queryBuilder.andWhere(
        '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR patient.uniqueId ILIKE :search OR patient.phoneNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    const [patients, count] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(count / limit);
    return { patients, count, totalPages, currentPage: page };
  };
  catch(error) {
    throw error;
  }

  //mark patient for discharge on a later date, the admissionStatus to be PENDING and the date be added to the dischargeDates
  markPatientForDischarge = async (
    patientId: string,
    dischargeDate: Date,
  ): Promise<Patient> => {
    try {
      const patient = await this.patientRepository
        .createQueryBuilder()
        .update(Patient)
        .set({
          admissionStatus: AdmissionStatusEnum.PENDING,
          dischargeDates: () => `dischargeDates || '{${dischargeDate}}'`,
        })
        .where('id = :id', { id: patientId })
        .returning('*')
        .execute();
      return patient.raw[0];
    } catch (error) {
      throw error;
    }
  };
}
