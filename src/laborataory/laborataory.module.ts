import { Module } from '@nestjs/common';
import { LaborataoryService } from './service/laborataory.service';
import { LaborataoryResolver } from './resolver/laborataory.resolver';
import { Test } from './entities/test.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Test])],
  providers: [LaborataoryResolver, LaborataoryService]
})
export class LaborataoryModule {}
