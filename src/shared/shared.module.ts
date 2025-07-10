import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedResolver } from './resolver/shared.resolver';
import { SharedService } from './service/shared.service';
import { SharedEntity, SharedSchema } from './entity/shared.entity';
import { PresentationModule } from 'src/presentation/presentation.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: SharedEntity.name,
        useFactory: () => {
          return SharedSchema;
        },
      },
    ]),
    PresentationModule,
  ],
  providers: [SharedResolver, SharedService],
})
export class SharedModule {}
