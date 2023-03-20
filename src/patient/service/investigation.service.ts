import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { FilterDto } from "src/utils/dtos/filter.dto";
import { Repository } from "typeorm";
import { CreateInvestigationInput } from "../dto/create-investigation.dto";
import { InvestigationResponse } from "../dto/investigation-return.dto";
import { UpdateInvestigationInput } from "../dto/update-investigation.dto";
import { InvestigationEntity } from "../entities/investigation.entity";
import { InvestigationStatusEnum } from "../enum/investigation-status.enum";

@Injectable()
export class InvestigationService {
    constructor(
        @InjectRepository(InvestigationEntity)
        private readonly investigationRepository: Repository <InvestigationEntity>
    ) {}

    //create investigation
    create = async (data: CreateInvestigationInput, id: User): Promise<InvestigationEntity> => {
        try {
            const investigation = this.investigationRepository.create(data);
            //assign unique
            const unique = Date.now().toString().slice(0, 6);
            investigation.uniqueCode = unique;
            investigation.doctor = id;
            return await this.investigationRepository.save(investigation);
        }
        catch (error) {
            throw error;
        }
    }

    //update investigation
    update = async (id: string, data: UpdateInvestigationInput): Promise<InvestigationEntity> => {
        try {
            const investigation = await this.investigationRepository.findOneOrFail({
                where: { id }
            });
            if (!investigation) throw new Error('Investigation not found');
            return await this.investigationRepository.save({
                ...investigation,
                ...data
            });
        }
        catch (error) {
            throw error;
        }
    }

    //update investigation result
    updateResult = async (id: string, data: UpdateInvestigationInput, user: User): Promise<InvestigationEntity> => {
        try {
            const { result } = data;
            const investigation = await this.investigationRepository.findOneOrFail({
                where: { id }
            });
            if (!investigation) throw new Error('Investigation not found');
            if(investigation.investigationStatus === InvestigationStatusEnum.COMPLETED) throw new Error('Investigation already completed'
            );
            if(investigation.investigationStatus !== InvestigationStatusEnum.ONGOING) throw new Error('Investigation not yet approved');
            investigation.result.doneBy = user;
            investigation.result.doneAt = new Date();
            investigation.investigationStatus = InvestigationStatusEnum.COMPLETED;

            return await this.investigationRepository.save({
                ...investigation,
                result
            });
        }
        catch (error) {
            throw error;
        }
    }

    //start investigation and mark it is as ongoing
    start = async (id: string, user: User): Promise<InvestigationEntity> => {
        try {
            const investigation = await this.investigationRepository.findOneOrFail({
                where: { id }
            });
            if (!investigation) throw new Error('Investigation not found');
            if(investigation.investigationStatus === InvestigationStatusEnum.COMPLETED) throw new Error('Investigation already completed')
            if(investigation.investigationStatus === InvestigationStatusEnum.ONGOING) throw new Error('Investigation already started')
            investigation.investigationStatus = InvestigationStatusEnum.ONGOING;
            
            return await this.investigationRepository.save({
                ...investigation,
            });
        }
        catch (error) {
            throw error;
        }
    }

    //delete investigation
    remove = async (id: string): Promise<string> => {
        try {
            const investigation = await this.investigationRepository.findOneOrFail({
                where: { id }
            });
            if (!investigation) throw new Error('Investigation not found');
            await this.investigationRepository.remove(investigation);
            return 'Investigation deleted successfully';
        }
        catch (error) {
            throw error;
        }
    }

    //get pending investigations
    getPending = async (data?: FilterDto): Promise<InvestigationResponse> => {
        try {
            const { startDate, endDate, page, limit, search } = data;
            const query = this.investigationRepository.createQueryBuilder('investigation');
            //populate patient and test
            query.leftJoinAndSelect('investigation.patient', 'patient');
            query.leftJoinAndSelect('investigation.test', 'test');
            //filter by date
            if (startDate) {
                const end = endDate ? new Date(endDate).toISOString()
                .replace(/T.*/, 'T23:59:59.999Z') : new Date(startDate).toISOString().replace(/T.*/, 'T23:59:59.999Z');
                const start = new Date(startDate).toISOString().replace(/T.*/, 'T00:00:00.000Z');
                query.andWhere('investigation.createdAt BETWEEN :startDate AND :endDate', { startDate: start, endDate: end });
            }
            //filter by search..we are searching by patient name, patient phone, patient email, test name of the investigations
            if (search) {
                query.andWhere('patient.firstName LIKE :search OR patient.lastName LIKE :search OR patient.phoneNumber LIKE :search OR patient.unique LIKE :search OR test.name LIKE :search', { search: `%${search}%` });
            }
            //filter by status
            query.andWhere('investigation.investigationStatus = :status', { status: InvestigationStatusEnum.PENDING });
            //order by date
            query.orderBy('investigation.createdAt', 'DESC');
            //paginate
            const [investigations, count] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
            const totalPages = Math.ceil(count / limit);
            return { investigations, count, totalPages, currentPage: page };
        }
        catch (error) {
            throw error;
        }
    }

    //get pending and ongoing investigations together
    getPendingAndOngoing = async (data?: FilterDto): Promise<InvestigationResponse> => {
        try {
            const { startDate, endDate, page, limit, search } = data;
            const query = this.investigationRepository.createQueryBuilder('investigation');
            //populate patient and test
            query.leftJoinAndSelect('investigation.patient', 'patient');
            query.leftJoinAndSelect('investigation.test', 'test');
            //filter by date
            if (startDate) {
                const end = endDate ? new Date(endDate).toISOString()
                .replace(/T.*/, 'T23:59:59.999Z') : new Date(startDate).toISOString().replace(/T.*/, 'T23:59:59.999Z');
                const start = new Date(startDate).toISOString().replace(/T.*/, 'T00:00:00.000Z');
                query.andWhere('investigation.createdAt BETWEEN :startDate AND :endDate', { startDate: start, endDate: end });
            }
            //filter by search..we are searching by patient name, patient phone, patient email, test name of the investigations
            if (search) {
                query.andWhere('patient.firstName LIKE :search OR patient.lastName LIKE :search OR patient.phoneNumber LIKE :search OR patient.unique LIKE :search OR test.name LIKE :search', { search: `%${search}%` });
            }
            //filter by status
            query.andWhere('investigation.investigationStatus = :status OR investigation.investigationStatus = :status1', { status: InvestigationStatusEnum.PENDING, status1: InvestigationStatusEnum.ONGOING });
            //order by date
            query.orderBy('investigation.createdAt', 'DESC');
            //paginate
            const [investigations, count] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
            const totalPages = Math.ceil(count / limit);
            return { investigations, count, totalPages, currentPage: page };
        }
        catch (error) {
            throw error;
        }
    }

    //get completed investigations
    getCompleted = async (data?: FilterDto): Promise<InvestigationResponse> => {
        try {
            const { startDate, endDate, page, limit, search } = data;
            const query = this.investigationRepository.createQueryBuilder('investigation');
            //populate patient and test
            query.leftJoinAndSelect('investigation.patient', 'patient');
            query.leftJoinAndSelect('investigation.test', 'test');
            //filter by date
            if (startDate) {
                const end = endDate ? new Date(endDate).toISOString()
                .replace(/T.*/, 'T23:59:59.999Z') : new Date(startDate).toISOString().replace(/T.*/, 'T23:59:59.999Z');
                const start = new Date(startDate).toISOString().replace(/T.*/, 'T00:00:00.000Z');
                query.andWhere('investigation.createdAt BETWEEN :startDate AND :endDate', { startDate: start, endDate: end });
            }
            //filter by search..we are searching by patient name, patient phone, patient email, test name of the investigations
            if (search) {
                query.andWhere('patient.firstName LIKE :search OR patient.lastName LIKE :search OR patient.phoneNumber LIKE :search OR patient.unique LIKE :search OR test.name LIKE :search', { search: `%${search}%` });
            }
            //filter by status
            query.andWhere('investigation.investigationStatus = :status', { status: InvestigationStatusEnum.COMPLETED });
            //order by date
            query.orderBy('investigation.createdAt', 'DESC');
            //paginate
            const [investigations, count] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
            const totalPages = Math.ceil(count / limit);
            return { investigations, count, totalPages, currentPage: page };
        }
        catch (error) {
            throw error;
        }
    }

    //get investigation records stats...check through all investigations and arrange the first 6 most carried out tests with count of each and then aggregate the rest as others with the count
    getInvestigationStats = async (): Promise<any> => {
        try {
            const query = this.investigationRepository.createQueryBuilder('investigation');
            query.select('test.name', 'name');
            query.addSelect('COUNT(investigation.id)', 'count');
            query.leftJoin('investigation.test', 'test');
            query.groupBy('test.name');
            query.orderBy('count', 'DESC');
            const investigations = await query.getRawMany();
            const stats = [];
            let others = 0;
            for (let i = 0; i < investigations.length; i++) {
                if (i < 6) {
                    stats.push(investigations[i]);
                } else {
                    others += investigations[i].count;
                }
            }
            if (others > 0) {
                stats.push({ name: 'Others', count: others });
            }
            return { stats };
        }catch (error) {
            throw error;
        }
    }
    
}