import { Args, Query, Resolver } from '@nestjs/graphql';
import { DriveService } from '../service/drive.service';
import {
  AllDriveARes,
  DriveArgs,
  DriveTitleCatRes,
  SearchDriveArgs,
} from '../types/drive.type';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { ObjectId } from 'mongodb';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class DriveResolver {
  constructor(private readonly driveService: DriveService) {}

  // Get all drive content
  @Query(() => DriveTitleCatRes)
  async getDriveByTitleCategory(
    @GetUser('_id') userId: ObjectId,
    @Args() driveArgs: DriveArgs,
  ) {
    const { page, limit, component, dateCreated } = driveArgs;

    return await this.driveService.getDriveByTitleCategory(
      userId,
      component,
      dateCreated,
      page || 1,
      limit || 15,
    );
  }

  // Get all drive content
  @Query(() => AllDriveARes)
  async getAllDrive(
    @GetUser('_id') userId: ObjectId,
    @Args() driveArgs: DriveArgs,
  ) {
    const { page, limit, component, dateCreated } = driveArgs;

    return await this.driveService.getAllDrive(
      userId,
      component,
      dateCreated,
      Math.max(page, 1),
      Math.max(limit, 1),
    );
  }

  // Search drive
  @Query(() => AllDriveARes)
  async searchDrive(
    @GetUser('_id') userId: ObjectId,
    @Args() searchDriveArgs: SearchDriveArgs,
  ) {
    const { page, limit, search } = searchDriveArgs;

    return await this.driveService.searchDrive(
      userId,
      search,
      Math.max(page, 1),
      Math.max(limit, 1),
    );
  }
}
