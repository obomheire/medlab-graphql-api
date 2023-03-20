import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service';
import { RoleResolver } from './resolver/role.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Designation } from './entities/designation.entity';
import { DesignationResolver } from './resolver/designation.resolver';
import { DesignationService } from './service/designation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role]), TypeOrmModule.forFeature([Designation])],
  providers: [RoleResolver, RoleService, DesignationService, DesignationResolver]
})
export class RoleModule {}
