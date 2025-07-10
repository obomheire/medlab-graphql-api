import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { WsService } from '../service/ws.service';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Streaks } from 'src/utilities/interface/interface';
import { eventEmitterType } from 'src/utilities/enum/env.enum';
import {
  ChannelHomeFeedRes,
  ChannelsEpisodeRes,
  GetMobileChannelEventsRes,
  MobileChannelRes,
} from 'src/chat-simulation/types/chat.types';
import { GeneralGroupType } from '../env.enum';
import { PodcastProgressInput } from '../dto/ws.dto';
import { PodcastService } from 'src/chat-simulation/service/podcast.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    credentials: true,
  },
  namespace: 'ws',
})
export class WsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsService.name);

  constructor(
    private readonly wsService: WsService,
    private readonly podcastService: PodcastService,
  ) {}

  // Called when the WebSocket gateway has been initialized
  afterInit(server: Server) {
    this.logger.log('WsGateway initialized');
  }

  // Called when a client connects to the WebSocket server
  async handleConnection(client: Socket) {
    try {
      await this.wsService.handleConnection(client);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Called when a client disconnects from the WebSocket server
  async handleDisconnect(client: Socket) {
    // await this.wsService.handleDisconnect(client);
  }

  // Emit daily and weekly streaks event
  @OnEvent(eventEmitterType.GET_USER_UPDATE)
  getStreaks(userUUID: string, streaks: Streaks) {
    try {
      const client = this.wsService.clients.get(userUUID);

      if (client?.clientID) {
        this.server.to(client.clientID).emit('streaksUpdate', streaks);
      }
    } catch (error) {
      this.logger.log('Error emitting streaks update:', error.message);
    }
  }

  // Emit subscription update event
  @OnEvent(eventEmitterType.SUBSCRIPTION_UPDATE)
  getSubscription(userUUID: string, subscription: any) {
    try {
      const client = this.wsService.clients.get(userUUID);

      if (client?.clientID) {
        this.server.to(client.clientID).emit('subUpdate', subscription);
      }
    } catch (error) {
      this.logger.log('Error emitting streaks update:', error.message);
    }
  }

  // Emmit channels events
  @OnEvent(eventEmitterType.CHANNELS_EPISODE)
  channelEpisode(channelEpisode: ChannelsEpisodeRes) {
    try {
      this.server
        .to(GeneralGroupType.GENERAL_GROUP)
        .emit('channelEpisode', channelEpisode);
    } catch (error) {
      this.logger.log('Error emitting simulation:', error.message);
    }
  }

  //Emit channel events
  @OnEvent(eventEmitterType.CHANNEL_EVENTS)
  channelEvents(channelEvents: GetMobileChannelEventsRes[]) {
    try {
      this.server
        .to(GeneralGroupType.GENERAL_GROUP)
        .emit('channelEvents', channelEvents);
    } catch (error) {
      this.logger.log('Error emitting channelEvents:', error.message);
    }
  }

  // Emit channel home feed
  @OnEvent(eventEmitterType.CHANNEL_HOME_FEED)
  channelHomeFeed(channelHomeFeed: ChannelHomeFeedRes[]) {
    try {
      this.server
        .to(GeneralGroupType.GENERAL_GROUP)
        .emit('channelHomeFeed', channelHomeFeed);
    } catch (error) {
      this.logger.log('Error emitting channelHomeFeed:', error.message);
    }
  }

  // Emit channel
  @OnEvent(eventEmitterType.CHANNEL)
  channel(channel: MobileChannelRes[]) {
    try {
      this.server.to(GeneralGroupType.GENERAL_GROUP).emit('channel', channel);
    } catch (error) {
      this.logger.log('Error emitting channel:', error.message);
    }
  }

  // Emit podcast generated
  @OnEvent(eventEmitterType.PODCAST_GENERATED)
  podcastGenerated(userUUID: string, podcast: { fileUrl: string }) {
    try {
      const client = this.wsService.clients.get(userUUID);

      if (client?.clientID) {
        this.server.to(client.clientID).emit('generatedPodcast', podcast);
      }
    } catch (error) {
      this.logger.log('Error emitting channel:', error.message);
    }
  }

  // Save podcast progress
  @SubscribeMessage('podcast-progress')
  async podcastProgress(
    @MessageBody() podcastProgress: PodcastProgressInput,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.wsService.validateInput(PodcastProgressInput, podcastProgress);

      const { userUUID } = this.wsService.getClientUser(client);

      await this.podcastService.saveProgress(userUUID, podcastProgress);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }
}
