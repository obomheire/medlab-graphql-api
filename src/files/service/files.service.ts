import { BadRequestException, Injectable } from '@nestjs/common';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { AwsS3Service } from './aws-s3.service';
import { FilesUploadRes } from '../types/files.types';
import { extname } from 'path';

@Injectable()
export class FilesService {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  // Upload files
  async filesUpload(files: FileUpload[]): Promise<FilesUploadRes> {
    try {
      const secure_urls = await Promise.all(
        files.map(async (_file) => {
          const file = await _file; // Await the promise to get the file object
          const fileExtension = extname(file.filename).toLowerCase(); // Get file extension

          const { createReadStream } = file;
          const stream = createReadStream();

          const { secure_url } = await this.awsS3Service.uploadFile(
            'general-files',
            stream,
            fileExtension,
          ); // Upload file to S3

          // Return result for each file
          return secure_url;
        }),
      );

      return { filesUrl: secure_urls };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
