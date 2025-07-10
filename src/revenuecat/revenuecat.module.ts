import { Module } from '@nestjs/common';
import { RevenuecatService } from './service/revenuecat.service';
import { RevenuecatController } from './controller/revenuecat.controller';

@Module({
  imports: [],
  controllers: [RevenuecatController],
  providers: [RevenuecatService],
})
export class RevenuecatModule {}
