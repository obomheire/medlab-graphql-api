import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  DeleteObjectCommandOutput,
  DeleteObjectsCommandInput,
  PutObjectCommandOutput,
  DeleteObjectsCommandOutput,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { buffer } from 'node:stream/consumers';
import sharp from 'sharp';
import { FileUpload, ReadStream } from 'graphql-upload-ts';
import { Readable } from 'stream';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import { PassThrough } from 'node:stream';

@Injectable()
export class AwsS3Service {
  private readonly region: string;
  private readonly bucket: string;
  private readonly folder: string;
  private readonly s3Client: S3Client;
  private readonly cloudFrontClient: CloudFrontClient;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_S3_REGION');
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET');
    this.folder = this.configService.get<string>('AWS_S3_FOLDER');

    const clientConfig = {
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    };

    this.s3Client = new S3Client(clientConfig);
    this.cloudFrontClient = new CloudFrontClient(clientConfig);
  }

  // Upload a single image to S3
  async uploadImage(
    destination: string,
    fileStream: ReadStream | Readable,
  ): Promise<{ secure_url: string }> {
    try {
      const fileName = crypto.randomBytes(32).toString('hex');

      const key =
        this.folder === 'none'
          ? `${destination}/${fileName}.jpeg`
          : `${this.folder}/${destination}/${fileName}.jpeg`;

      // Resize the image
      const file = await sharp(await buffer(fileStream))
        .resize({
          height: 768,
          // width: 1024,
          fit: 'contain',
        })
        .jpeg({ mozjpeg: true })
        .toFormat('jpeg')
        .toBuffer();

      const input: PutObjectCommandInput = {
        Body: file,
        Bucket: this.bucket,
        Key: key,
        ACL: 'public-read',
      };

      const response: PutObjectCommandOutput = await this.s3Client.send(
        new PutObjectCommand(input),
      );

      const secure_url = `https://d1p9fc0i566fiv.cloudfront.net/${key}`;

      if (response.$metadata.httpStatusCode === 200) {
        return { secure_url };
      }

      throw new BadRequestException('Image is not saved to S3 bucket!');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete single or multiple images from S3
  async deleteFiles(imageUrls: string[]): Promise<void> {
    try {
      const filePaths = imageUrls.map((url) => {
        return url.replace(/^https:\/\/d1p9fc0i566fiv\.cloudfront\.net\//, '');
      });

      const deleteParams: DeleteObjectsCommandInput = {
        Bucket: this.bucket,
        Delete: {
          Objects: filePaths.map((filePath) => ({ Key: filePath })),
          Quiet: true,
        },
      };

      const response: DeleteObjectsCommandOutput = await this.s3Client.send(
        new DeleteObjectsCommand(deleteParams),
      );

      if (response.$metadata.httpStatusCode !== 200) {
        throw new Error('Image is not deleted from S3 bucket!');
      }

      await this.invalidateCache(filePaths);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upload multiple images to S3
  async uploadImages(
    destination: string,
    fileStreams: ReadStream[] | Readable[],
  ): Promise<{ secure_url: string }[]> {
    try {
      return await Promise.all(
        fileStreams.map(
          async (fileStream) => await this.uploadImage(destination, fileStream),
        ),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upload a single file to S3
  async uploadFile(
    destination: string,
    fileInput: ReadStream | Buffer,
    fileExtension: string,
    mimetype?: string,
  ): Promise<{ secure_url: string }> {
    try {
      const fileName = crypto.randomBytes(32).toString('hex');

      const key =
        this.folder === 'none'
          ? `${destination}/${fileName}${fileExtension}`
          : `${this.folder}/${destination}/${fileName}${fileExtension}`;

      // If fileInput is a stream, convert it to buffer
      const file: Buffer =
        fileInput instanceof Buffer
          ? fileInput
          : await this.streamToBuffer(fileInput as ReadStream);

      if (!(fileInput instanceof Buffer)) {
        (fileInput as ReadStream).destroy(); // Clean up the stream if needed
      }

      const input: PutObjectCommandInput = {
        Body: file,
        Bucket: this.bucket,
        Key: key,
        ACL: 'public-read',
        ContentType: mimetype ?? 'image/png',
      };

      const response: PutObjectCommandOutput = await this.s3Client.send(
        new PutObjectCommand(input),
      );

      const secure_url = `https://d1p9fc0i566fiv.cloudfront.net/${key}`;

      if (response.$metadata.httpStatusCode === 200) {
        return { secure_url };
      }

      throw new BadRequestException('File is not saved to S3 bucket!');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Invalidate cloudfont cache when image is deleted
  private async invalidateCache(filePaths: string[]): Promise<void> {
    try {
      const invalidationParams = {
        DistributionId: this.configService.get<string>('AWS_DISTRIBUTION_ID'),
        InvalidationBatch: {
          CallerReference: filePaths[0], // Unique reference for each invalidation
          Paths: {
            Quantity: filePaths.length,
            Items: filePaths.map((filePath) => `/${filePath}`),
          },
        },
      };

      await this.cloudFrontClient.send(
        new CreateInvalidationCommand(invalidationParams),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Convert file stream to buffer
  async streamToBuffer(stream: ReadStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    return buffer;
  }

  // Stream a podcast from s3
  async streamPodcast(url: string): Promise<Readable> {
    try {
      const key = url.replace(
        /^https:\/\/d1p9fc0i566fiv\.cloudfront\.net\//,
        '',
      ); // Remove the cloudfront domain from the url

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command); // Get the object from s3

      return response.Body as Readable;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
