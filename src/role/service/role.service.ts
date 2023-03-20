import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleInput } from '../dto/create-role.input';
import { RoleReturnDto } from '../dto/role-return.dto';
import { UpdateRoleInput } from '../dto/update-role.input';
import { Designation } from '../entities/designation.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleService {
  constructor(@InjectRepository(Role) private readonly roleRepository: Repository<Role> ) {}

  async create(createRoleInput: CreateRoleInput): Promise<Role> {
    try {
      const role = this.roleRepository.create(createRoleInput);
      return await this.roleRepository.save(role);
    }
    catch (error) {
      throw error;
    }
  }

  //find all and search by name
  async findAll(search: string): Promise<Role[]> {
    try {
      if (search) {
        const roles = await this.roleRepository.find();
        const filteredRoles = roles.filter(role => role.name.toLowerCase().includes(search.toLowerCase()));
        return filteredRoles;
      }
      return await this.roleRepository.find();
    }
    catch (error) {
      throw error;
    }
  }

  async findOne(id: string, search?: string): Promise<RoleReturnDto> {
    try {
      const role = await this.roleRepository.findOneOrFail({ where: { id }, relations: [ 'designations' ] });
      const designations = role.designations;
        if (search) {
          const filteredDesignations = designations.filter(designation => designation.name.toLowerCase().includes(search.toLowerCase()));
          return {designations: filteredDesignations, role}
        }
        return {designations, role};
    }
    catch (error) {
      throw error;
    }
  }

  async update(id: string, updateRoleInput: UpdateRoleInput): Promise<Role> {
    try {
      const role = await this.roleRepository.findOneOrFail({ where: { id } });
      if (!role) {
        throw new NotFoundException('Role not found');
      } else {
        role.name = updateRoleInput.name;
        return await this.roleRepository.save(role);
      }
    }
    catch (error) {
      throw error;
    }
  }

  // //get all designations for a role and search by the names of designations
  // async getDesignations(id: string, search: string): Promise<Designation[] | void> {
  //   try {
  //     const role = await this.roleRepository.findOneOrFail({ where: { id } });
  //     if (!role) {
  //       throw new NotFoundException('Role not found');
  //     } else {
  //       const designations = role.designations;
  //       if (search) {
  //         const filteredDesignations = designations.filter(designation => designation.name.toLowerCase().includes(search.toLowerCase()));
  //         return filteredDesignations;
  //       }
  //       return designations;
  //     }
  //   }
  //   catch (error) {
  //     throw error;
  //   }
  // }

  async remove(id: string): Promise<string> {
    try {
      const role = await this.roleRepository.findOneOrFail({ where: { id } });
      if (!role) {
        throw new NotFoundException('Role not found');
      } else {
        await this.roleRepository.delete(id);
        return 'Role deleted successfully';
      }
    }
    catch (error) {
      throw error;
    }
  }


}
