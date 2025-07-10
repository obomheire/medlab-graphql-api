import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TempFileDocument, TempFileEntity } from '../entity/tempFile.entity';
import { Model } from 'mongoose';
import { isUUID } from 'class-validator';

@Injectable()
export class UtilitiesService {
  constructor(
    @InjectModel(TempFileEntity.name)
    private tempFileModel: Model<TempFileDocument>,
  ) {}

  // Ceate temporary file
  async createTempFile(tempFile: TempFileEntity): Promise<TempFileDocument> {
    try {
      return await this.tempFileModel.create(tempFile);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get temp files to delete
  async getTempFileByUUID(
    tempFileUUID: string,
    isFileUrl?: boolean,
  ): Promise<string> {
    try {
      const tempFile = await this.tempFileModel.findOne({ tempFileUUID });

      if (!tempFile) {
        throw new BadRequestException(
          `Temp file with ID ${tempFileUUID} not found`,
        );
      }

      if (isFileUrl) {
        return tempFile?.fileUrl;
      }

      return tempFile?.content;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete temporary files by  tempFileUUID
  async deleteTempFiles(tempFileUUIDs: string[]): Promise<void> {
    try {
      await this.tempFileModel.deleteMany({
        tempFileUUID: { $in: tempFileUUIDs },
      }); // Delete temp file records from DB
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async _deleteTempFiles(fileRefs: string[]): Promise<void> {
    const query = fileRefs.reduce((acc, ref) => {
      if (isUUID(ref)) {
        acc.push({ tempFileUUID: ref });
      } else if (ref.startsWith('http://') || ref.startsWith('https://')) {
        acc.push({ fileUrl: ref });
      }
      return acc;
    }, []);

    if (query.length === 0) return;

    try {
      await this.tempFileModel.deleteMany({ $or: query });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get temp files to delete
  async getTempFilesToDelete() {
    try {
      const tempFiles = await this.tempFileModel
        .find({
          createdAt: {
            $lte: new Date(new Date().setDate(new Date().getDate() - 1)), // look for 1 day old record
          },
        })
        .lean();

      const tempFileUUIDs = tempFiles.map((file) => file.tempFileUUID);
      const fileUrls = tempFiles
        .filter((file) => file.fileUrl)
        .map((file) => file.fileUrl);

      return { tempFileUUIDs, fileUrls };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
