import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { FilesService } from '../service/files.service';
import { FilesUploadRes } from '../types/files.types';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class FilesResolver {
  constructor(private readonly aiAssistantService: FilesService) {}

  // Files upload
  @Mutation(() => FilesUploadRes)
  async filesUpload(
    @Args({ name: 'files', type: () => [GraphQLUpload] })
    files: FileUpload[],
  ) {
    return await this.aiAssistantService.filesUpload(files);
  }
}
