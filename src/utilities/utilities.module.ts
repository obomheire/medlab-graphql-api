import { Global, Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TempFileEntity, TempFileSchema } from './entity/tempFile.entity';
import { UtilitiesService } from './service/utilities.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: TempFileEntity.name,
        useFactory: () => {
          return TempFileSchema;
        },
      },
    ]),
  ],
  providers: [UtilitiesService],
  exports: [UtilitiesService],
})
export class UtilitiesModule {}
