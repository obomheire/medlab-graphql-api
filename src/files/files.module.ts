import { Global, Module } from '@nestjs/common';
import { AwsS3Service } from './service/aws-s3.service';
import { FilesService } from './service/files.service';
import { FilesResolver } from './resolver/files.resolver';

@Global()
@Module({
  imports: [],
  providers: [AwsS3Service, FilesResolver, FilesService],
  exports: [AwsS3Service],
})
export class FilesModule {}
