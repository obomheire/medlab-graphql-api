import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RoleDocument, RoleEntity } from '../entity/role.entity';
import { Model } from 'mongoose';
import { SpecialtyDocument, SpecialtyEntity } from '../entity/specialty.entity';
import ShortUniqueId from 'short-unique-id';
import { SpecialtyRes, SubspecialtyRes } from '../types/user.types';
import { OptionType } from 'src/onboarding/types/oboarding.types';

@Injectable()
export class PositionService {
  private readonly uid = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(RoleEntity.name)
    private readonly roleModel: Model<RoleDocument>,
    @InjectModel(SpecialtyEntity.name)
    private readonly specialtyModel: Model<SpecialtyDocument>,
  ) {}

  // Insert roles
  async insertRoles(): Promise<RoleEntity[]> {
    try {
      const roles = [];

      const documents = roles.map((roleName) => ({
        roleName,
      }));

      return await this.roleModel.insertMany(documents);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all roles
  async getAllRoles(): Promise<RoleEntity[]> {
    try {
      const roles = await this.roleModel.find().exec();

      return roles;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Insert Specialty
  async insertSpecialties(): Promise<SpecialtyEntity[]> {
    try {
      const specialties = [];

      const documents = specialties.map((specialty) => {
        const subspecialties = specialty.subspecialty.map((sub) => ({
          subspecId: this.uid.rnd(),
          subspecialty: sub,
        }));

        return {
          specialty: specialty.specialty,
          subspecialty: subspecialties,
        };
      });

      return this.specialtyModel.insertMany(documents);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all roles
  async getAllSpecialty(): Promise<RoleEntity[]> {
    try {
      const roles = await this.roleModel.find().exec();

      return roles;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all specialties
  async getAllSpecialties(): Promise<SpecialtyRes[]> {
    try {
      return await this.specialtyModel.find({}).exec();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get subspecialties
  async getSubspecialty(specialtyUUID: string): Promise<SubspecialtyRes[]> {
    const specialty = await this.specialtyModel
      .findOne({ specialtyUUID }, 'subspecialty')
      .exec();

    return specialty ? specialty.subspecialty : [];
  }

  //This is used in onboarding process
  async getAllSpecialtiesForOnboarding(): Promise<OptionType[]> {
    // Fetch all specialties with their subspecialties from the database
    const specialties = await this.specialtyModel.find().exec();

    // Transform the data into the desired format
    const result = specialties.map((specialty) => ({
      title: specialty.specialty,
      route: specialty.specialty,
      key: null,
      subspecialties: specialty.subspecialty.map((sub) => sub.subspecialty),
    }));

    return result;
  }
}
