import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { ChatSimulationMobileService } from '../service/chat-simulation.mobile.service';
import {
  ChannelHomeFeedRes,
  ChannelsEpisodeRes,
  ChatMobileExporeChannelRes,
  GetEpisodeSimulationRes,
  GetMobileChannelEventsRes,
  GetMobileChannelsRes,
  MobileChannelRes,
  MobileChannelsEventsRes,
  SimulationEventDetailsRes,
  UserVisitedChannelsRes,
} from '../types/chat.types';
import { GetEpisodeSimulationInput } from '../dto/chat-simulation.input';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { OptionalAccessTokenAuthGuard } from 'src/auth/guard/optionalAccessToken.guard';

@Resolver()
export class ChatSimulationMobileResolver {
  constructor(private mobileSimulationService: ChatSimulationMobileService) {}

  //Get all channels
  @Query(() => [GetMobileChannelsRes])
  async getChatMobileChannels(
    @Args({ name: 'channelName', type: () => String, nullable: true })
    channelName: string,
  ): Promise<GetMobileChannelsRes[]> {
    return this.mobileSimulationService.getChatMobileChannels(channelName);
  }

  //Get all channel events
  @UseGuards(OptionalAccessTokenAuthGuard)
  @Query(() => GetMobileChannelEventsRes)
  async getChatMobileChannelEvents(
    @Args({ name: 'channelName', type: () => String })
    channelName: string,
    @Args({ name: 'eventName', type: () => String, nullable: true })
    eventName: string,
    @GetUser('userUUID') userUUID?: string, // this is only use for saving the activity of the user when he/she calls this endpoint
  ): Promise<GetMobileChannelEventsRes> {
    return this.mobileSimulationService.getChatMobileChannelEvents(
      channelName,
      eventName,
      userUUID,
    );
  }

  //Get all event episodes
  @UseGuards(OptionalAccessTokenAuthGuard)
  @Query(() => ChannelsEpisodeRes)
  async getChatMobileEventEpisodes(
    @Args({ name: 'eventName', type: () => String })
    eventName: string,
    @Args({ name: 'episode', type: () => String, nullable: true })
    episode: string,
    @Args({ name: 'page', type: () => Number, nullable: true })
    page: number,
    @Args({ name: 'limit', type: () => Number, nullable: true })
    limit: number,
    @GetUser('userUUID') userUUID: string, // this is only use for saving the activity of the user when he/she calls this endpoint
  ) {
    return this.mobileSimulationService.getChatMobileEventEpisodes(
      eventName,
      episode,
      userUUID,
      page || 1,
      limit || 10,
    );
  }

  //Get episode simulation
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => GetEpisodeSimulationRes)
  async getChatMobileEpisodeSimulation(
    @Args({ name: 'getSimulationInput', type: () => GetEpisodeSimulationInput })
    getSimulationInput: GetEpisodeSimulationInput,
    @GetUser('userUUID') userUUID: string,
  ): Promise<GetEpisodeSimulationRes> {
    return this.mobileSimulationService.getEpisodeSimulation(
      getSimulationInput,
      userUUID,
    );
  }

  //Get user visited channels
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [UserVisitedChannelsRes])
  async getUserVisitedChannels(
    @GetUser('userUUID') userUUID: string,
  ): Promise<UserVisitedChannelsRes[]> {
    return this.mobileSimulationService.getUserVisitedChannels(userUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  async saveUserFollowedChannel(
    @Args({ name: 'channelName', type: () => String }) channelName: string,
    // @Args({ name: 'channelUUID', type: () => String }) channelUUID: string,
    @GetUser('userUUID') userUUID: string,
  ) {
    return await this.mobileSimulationService.saveUserFollowedChannel(
      channelName,
      // channelUUID,
      userUUID,
    );
  }

  @UseGuards(OptionalAccessTokenAuthGuard)
  @Query(() => ChannelHomeFeedRes)
  async getChannelHomeFeed(@GetUser('userUUID') userUUID: string) {
    return await this.mobileSimulationService.getChannelHomeFeed(userUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => MobileChannelRes)
  async getMobileChannel_v2(
    @Args('channelName') channelName: string,
    @GetUser('userUUID') userUUID: string,
  ) {
    return await this.mobileSimulationService.getMobileChannel_v2(
      channelName,
      userUUID,
    );
  }

  @Query(() => ChannelsEpisodeRes)
  async getMobileChannelEpisodes_v2(
    @Args('channelName') channelName: string,
    @Args({ name: 'page', type: () => Number, nullable: true }) page: number,
    @Args({ name: 'limit', type: () => Number, nullable: true }) limit: number,
  ) {
    return await this.mobileSimulationService.getMobileChannelEpisodes_v2(
      channelName,
      page || 1,
      limit || 10,
    );
  }

  @Query(() => MobileChannelsEventsRes)
  async getMobileChannelEvents_v2(
    @Args('channelName') channelName: string,
    @Args({ name: 'limit', type: () => Number, nullable: true }) limit: number,
    @Args({ name: 'page', type: () => Number, nullable: true }) page: number,
  ) {
    return await this.mobileSimulationService.getMobileChannelEvents_v2(
      channelName,
      page,
      limit,
    );
  }

  @Query(() => SimulationEventDetailsRes)
  async getSimulationsDetails(@Args('eventName') eventName: string) {
    return await this.mobileSimulationService.getSimulationsDetails(eventName);
  }

  // Get the channels for the explore page
  @Query(() => [ChatMobileExporeChannelRes])
  async getExporeChannels(
    @Args({ name: 'channelName', type: () => String, nullable: true })
    channelName: string,
  ) {
    return await this.mobileSimulationService.getExporeChannels(channelName);
  }
}
