import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { FilterDto } from 'src/utils/dtos/filter.dto';
import { Repository } from 'typeorm';
import { CreateVisitInput, UpdateVisitInput } from '../dto/create-visit.dto';
import { Visit } from '../entities/visit.entity';

@Injectable()
export class VisitService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
  ) {}

  //create visit
  async createVisit(data: CreateVisitInput, user: User): Promise<Visit> {
    try {
      const visit = this.visitRepository.create(data);
      visit.uniqueCode = Date.now().toString().slice(0, 6);
      visit.doctor = user.id
      return await this.visitRepository.save(visit);
    } catch (error) {
      throw error;
    }
  }

  //get a visit
  async getVisit(id: string): Promise<Visit> {
    try {
      return await this.visitRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      throw error;
    }
  }

  //get all visits for a patient
  async getVisits(patientId: string, data?: FilterDto): Promise<Visit[]> {
    try {
      const { startDate, endDate } = data;
      const query = this.visitRepository.createQueryBuilder('visit');
      query.where('visit.patientId = :patientId', { patientId });
      if (startDate && endDate) {
        query.andWhere('visit.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }
      return await query.getMany();
    } catch (error) {
      throw error;
    }
  }

  //update a visit
  async updateVisit(id: string, data: UpdateVisitInput): Promise<Visit> {
    try {
      const updates = await this.visitRepository.update({ id }, data);
      return await this.visitRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      throw error;
    }
  }

  //delete a visit
  async deleteVisit(id: string): Promise<string> {
    try {
      const visit = await this.visitRepository.findOneOrFail({ where: { id } });
      await this.visitRepository.delete({ id });
      return 'Visit deleted successfully'
    } catch (error) {
      throw error;
    }
  }

  //visit stats for the hospital
  async visitStats(): Promise<any> {
    try {
      const query = this.visitRepository.createQueryBuilder('visit');
      query.select('COUNT(visit.id)', 'totalVisits');
      query.addSelect('COUNT(DISTINCT visit.patientId)', 'totalPatients');
      query.addSelect('COUNT(DISTINCT visit.doctorId)', 'totalDoctors');
      // query.addSelect('COUNT(DISTINCT visit.departmentId)', 'totalDepartments');
      query.addSelect('COUNT(DISTINCT visit.uniqueCode)', 'totalUniqueVisits');
      // query.addSelect('COUNT(DISTINCT visit.visitNote)', 'totalVisitNotes');
      // query.addSelect('COUNT(DISTINCT visit.doctorNote)', 'totalDoctorNotes');
      query.addSelect('COUNT(DISTINCT visit.recommendation)', 'totalRecommendations');
      query.addSelect('COUNT(DISTINCT visit.assessmentLog)', 'totalAssessments');
      query.addSelect('COUNT(DISTINCT visit.prescriptions)', 'totalPrescriptions');
      query.addSelect('COUNT(DISTINCT visit.investigations)', 'totalInvestigations');
      query.addSelect('COUNT(DISTINCT visit.createdAt)', 'totalVisitDates');
      query.addSelect('COUNT(DISTINCT visit.updatedAt)', 'totalVisitUpdates');
      return await query.getRawOne();
    } catch (error) {
      throw error;
    }
  }


}
