import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { UtilitiesService } from 'src/utilities/service/utilities.service';

@Injectable()
export class DeleteTempFilesService {
  private readonly logger = new Logger(DeleteTempFilesService.name);

  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly awsS3Service: AwsS3Service,
  ) {
    this.logger.log('DeleteTempFilesService instantiated');
  }

  // @Cron('58 19  * * *') // run the cron @ 08: 49 pm
  @Cron('0 10 * * *') // Runs at 10:00 AM every day
  async deleteTempFiles() {
    this.logger.log('Cron job started');
    try {
      const { tempFileUUIDs, fileUrls } =
        await this.utilitiesService.getTempFilesToDelete();

      this.logger.log(`Found ${tempFileUUIDs.length} files to delete`);

      // Delete files from S3 first
      if (fileUrls.length) {
        await this.awsS3Service.deleteFiles(fileUrls);
      }

      await this.utilitiesService.deleteTempFiles(tempFileUUIDs); // Delete temp files from DB

      this.logger.log(`Deleted ${tempFileUUIDs.length} temp files`);
      this.logger.log('Cron job completed successfully');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
