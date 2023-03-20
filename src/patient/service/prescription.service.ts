import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { FilterDto } from "src/utils/dtos/filter.dto";
import { Repository, Between } from "typeorm";
import { PrescriptionResponse } from "../dto/prescription-return.dto";
import { UpdatePatientInput } from "../dto/update-patient.input";
import { PharmacyPrescription } from "../entities/prescription.entity";
import { PrescriptionStatusEnum } from "../enum/prescription-status.enum";

@Injectable()
export class PrescriptionService {
    constructor(
        @InjectRepository(PharmacyPrescription) private readonly prescriptionRepository: Repository<PharmacyPrescription>,
    ) {}

    //create prescription
    async createPrescription(data: PharmacyPrescription, id: User): Promise<PharmacyPrescription> {
        try {
            const prescription = this.prescriptionRepository.create(data);
            //assign unique
            const unique = Date.now().toString().slice(0, 6);
            prescription.uniqueCode = unique;
            prescription.doctor = id;
            return await this.prescriptionRepository.save(prescription);
        }
        catch (error) {
            throw error;
        }
    }

    //get all prescriptions
    async getAllPrescriptions(data?: FilterDto): Promise<PrescriptionResponse> {
        try {
            const { page, limit, search } = data;
            const skip = (page - 1) * limit;
            const [prescriptions, count] = await this.prescriptionRepository.findAndCount({
                where: {
                    patient: {
                        firstName: search,
                        lastName: search,
                        phoneNumber: search,
                        unique: search,
                    }
                },
                relations: ['patient', 'doctor'],
                skip,
                take: limit,
            });
            const totalPages = Math.ceil(count / limit);
            return { prescriptions, count, currentPage: page, totalPages };
        }
        catch (error) {
            throw error;
        }
    }

    //get a single prescription
    async getSinglePrescription(id: string): Promise<PharmacyPrescription> {
        try {
            const prescription = await this.prescriptionRepository.findOneOrFail({ where: { id }, relations: ['patient', 'doctor'] });
            return prescription;
        }
        catch (error) {
            throw error;
        }
    }

    //update prescription
    async updatePrescription(id: string, data: UpdatePatientInput): Promise<PharmacyPrescription> {
        try {
            const prescription = await this.prescriptionRepository.findOneOrFail({ where: { id } });
            const updatedPrescription = Object.assign(prescription, data);
            return await this.prescriptionRepository.save(updatedPrescription);
        }
        catch (error) {
            throw error;
        }
    }

    //delete prescription
    async deletePrescription(id: string): Promise<string> {
        try {
            const prescription = await this.prescriptionRepository.findOneOrFail({ where: { id } });
            await this.prescriptionRepository.remove(prescription);
            return 'Prescription deleted successfully';
        }
        catch (error) {
            throw error;
        }
    }

    //get all prescriptions for a patient
    async getPrescriptionsForPatient(id: string, data: FilterDto): Promise<PrescriptionResponse> {
        try {
            const { page, limit } = data;
            const skip = (page - 1) * limit;
            const [prescriptions, count] = await this.prescriptionRepository.findAndCount({
                where: { patient: { id } },
                relations: ['patient', 'doctor'],
                skip,
                take: limit,
            });
            const totalPages = Math.ceil(count / limit);
            return { prescriptions, count, totalPages, currentPage:page };
        }
        catch (error) {
            throw error;
        }
    }

    //get all prescriptions for a doctor
    async getPrescriptionsForDoctor(id: string, data: FilterDto): Promise<PrescriptionResponse> {
        try {
            const { page, limit } = data;
            const skip = (page - 1) * limit;
            const [prescriptions, count] = await this.prescriptionRepository.findAndCount({
                where: { doctor: { id } },
                relations: ['patient', 'doctor'],
                skip,
                take: limit,
            });
            const totalPages = Math.ceil(count / limit);
            return { prescriptions, count, totalPages, currentPage: page };
        }
        catch (error) {
            throw error;
        }
    }

    //get pending requests
    async getPendingRequests(data: FilterDto): Promise<PrescriptionResponse> {
        try {
            const { page, limit, search, startDate, endDate } = data;
            const skip = (page - 1) * limit;
            let start: any, end: any;
            if(startDate) {
                end = endDate ? new Date(endDate).toISOString().replace(/T.*/, 'T23:59:59.999Z') : new Date(startDate).toISOString().replace(/T.*/, 'T23:59:59.999Z');
                start = new Date(startDate).toISOString().replace(/T.*/, 'T00:00:00.000Z');
            }
            const [prescriptions, count] = await this.prescriptionRepository.findAndCount({
                where: {
                    status: PrescriptionStatusEnum.PENDING,
                    patient: {
                        firstName: search,
                        lastName: search,
                        phoneNumber: search,
                        unique: search,
                    },
                    createdAt: Between(start, end)
                },
                relations: ['patient', 'doctor'],
                skip,
                take: limit,
            });
            const totalPages = Math.ceil(count / limit);
            return { prescriptions, count, totalPages, currentPage: page };
        }
        catch (error) {
            throw error;
        }
    }

    //get completed requests
    async getCompletedRequests(data: FilterDto): Promise<PrescriptionResponse> {
        try {
            const { page, limit, search, startDate, endDate } = data;
            const skip = (page - 1) * limit;
            let start: any, end: any;
            if(startDate) {
                end = endDate ? new Date(endDate).toISOString().replace(/T.*/, 'T23:59:59.999Z') : new Date(startDate).toISOString().replace(/T.*/, 'T23:59:59.999Z');
                start = new Date(startDate).toISOString().replace(/T.*/, 'T00:00:00.000Z');
            }
            const [prescriptions, count] = await this.prescriptionRepository.findAndCount({
                where: {
                    status: PrescriptionStatusEnum.DISPENSED,
                    patient: {
                        firstName: search,
                        lastName: search,
                        phoneNumber: search,
                        unique: search,
                    },
                    createdAt: Between(start, end)
                },
                relations: ['patient', 'doctor'],
                skip,
                take: limit,
            });
            const totalPages = Math.ceil(count / limit);
            return { prescriptions, count, totalPages, currentPage: page };
        }
        catch (error) {
            throw error;
        }
    }

}