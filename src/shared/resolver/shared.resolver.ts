import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { MessageRes } from 'src/auth/types/auth.types';
import { ObjectId } from 'mongodb';
import { SharedService } from '../service/shared.service';
import { SharedInput } from '../dto/shared.input';
import { SharedRes } from '../types/shared.types';

@Resolver()
export class SharedResolver {
  constructor(private readonly sharedService: SharedService) {}

  // Receive shared content
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  async receiveSharedContent(
    @GetUser('_id') receiverId: ObjectId,
    @Args('sharedInput') { contentUUID, sharedContent }: SharedInput,
  ) {
    return this.sharedService.receiveSharedContent(
      receiverId,
      contentUUID,
      sharedContent,
    );
  }

  // Get shared content
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [SharedRes])
  async getSharedContent(@GetUser('_id') receiverId: ObjectId) {
    return this.sharedService.getSharedContent(receiverId);
  }
}
