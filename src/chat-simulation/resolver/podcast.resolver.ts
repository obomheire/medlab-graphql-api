import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import {
  PodcastChatCategoriesArgs,
  PodcastChatCategoriesRes,
  PodcastHomeFeedRes,
} from '../types/chat.types';
import { PodcastService } from '../service/podcast.service';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { OptionalAccessTokenAuthGuard } from 'src/auth/guard/optionalAccessToken.guard';

@Resolver()
export class PodcastResolver {
  constructor(private readonly podcastService: PodcastService) {}

  // Get podcast home feed
  @UseGuards(OptionalAccessTokenAuthGuard)
  @Query(() => PodcastHomeFeedRes)
  async getPodcastHomeFeed(
    @GetUser('userUUID') userUUID?: string,
  ): Promise<PodcastHomeFeedRes> {
    return await this.podcastService.getPodcastHomeFeed(userUUID);
  }

  // Get chat categories on the podcast app
  @Query(() => PodcastChatCategoriesRes)
  async getPodcastChatCategories(
    @Args() { page, limit }: PodcastChatCategoriesArgs,
  ) {
    return await this.podcastService.getPodcastChatCategories(
      page || 1,
      limit || 15,
    );
  }
}
