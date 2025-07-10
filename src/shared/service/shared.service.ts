import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId, Document } from 'mongodb';
import { SharedDocument, SharedEntity } from '../entity/shared.entity';
import { SharedContentType } from '../enum/shared.enum';
import { PresentationService } from 'src/presentation/service/presentation.service';

@Injectable()
export class SharedService {
  constructor(
    @InjectModel(SharedEntity.name)
    private readonly sharedModel: Model<SharedDocument>,
    private readonly presentationService: PresentationService,
  ) {}

  // Receive shared content
  async receiveSharedContent(
    receiverId: ObjectId,
    contentUUID: string,
    sharedContent: string,
  ) {
    try {
      let content: Document;
      let contentModel: string;

      switch (sharedContent) {
        case SharedContentType.SLIDE_PRESENTATION:
          content = await this.presentationService.getPresentation(contentUUID);
          contentModel = 'PresentationEntity';
          break;

        default:
          throw new BadRequestException('Invalid content type');
      }

      const sharedContentData = new this.sharedModel({
        sharedBy: content.userId,
        sharedWith: receiverId,
        contentId: content._id,
        sharedContent,
        contentModel,
      });

      await sharedContentData.save();

      return { message: 'You have successfully received the content.' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get shared content
  async getSharedContent(receiverId: ObjectId) {
    try {
      const sharedContent = await this.sharedModel
        .find({ sharedWith: receiverId })
        .populate('contentId')
        .populate({
          path: 'sharedWith',
          select: 'firstName lastName username',
        })
        .populate({
          path: 'sharedBy',
          select: 'firstName lastName username',
        })
        .lean(); // Convert to plain JavaScript objects

      if (!sharedContent || sharedContent.length === 0) {
        throw new BadRequestException('No shared content found for this user');
      }

      // Rename contentId to content
      const modifiedContent = sharedContent.map((item) => ({
        ...item,
        content: { ...item.contentId, _id: undefined, userId: undefined },
        contentId: undefined,
      }));

      return modifiedContent;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
