import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriveEntity, DriveSchema } from './entity/drive.entity';
import { DriveService } from './service/drive.service';
import { DriveResolver } from './resolver/drive.resolver';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: DriveEntity.name,
        useFactory: () => {
          return DriveSchema;
        },
      },
    ]),
  ],
  providers: [DriveService, DriveResolver],
  exports: [DriveService],
})
export class DriveModule {}
