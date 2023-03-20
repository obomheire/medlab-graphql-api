import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDesignationInput } from '../dto/create-designation.dto';
import { UpdateDesignationInput } from '../dto/update-designation.dto';
import { Designation } from '../entities/designation.entity';

@Injectable()
export class DesignationService {
  constructor(
    @InjectRepository(Designation)
    private readonly designationRepository: Repository<Designation>,
  ) {}

  create = async (
    createDesignationInput: CreateDesignationInput,
  ): Promise<Designation> => {
    try {
      const designation = this.designationRepository.create(
        createDesignationInput,
      );
      return await this.designationRepository.save(designation);
    } catch (error) {
      throw error;
    }
  };

  findAll = async (): Promise<Designation[]> => {
    try {
      return await this.designationRepository.find({ relations: ['role'] });
    } catch (error) {
      throw error;
    }
  };

  findOne = async (id: string): Promise<Designation> => {
    try {
      return await this.designationRepository.findOne({
        where: { id },
        relations: ['role'],
      });
    } catch (error) {
      throw error;
    }
  };

  update = async (
    id: string,
    updateDesignationInput: UpdateDesignationInput,
  ): Promise<Designation> => {
    try {
      const designation = await this.designationRepository.findOne({
        where: { id },
      });
      this.designationRepository.merge(designation, updateDesignationInput);
      return await this.designationRepository.save(designation);
    } catch (error) {
      throw error;
    }
  };

  remove = async (id: string): Promise<Designation> => {
    try {
      const designation = await this.designationRepository.findOne({
        where: { id },
      });
      return await this.designationRepository.remove(designation);
    } catch (error) {
      throw error;
    }
  };
}
