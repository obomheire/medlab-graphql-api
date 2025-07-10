import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { WsService } from '../service/ws.service';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsChannelService } from '../service/ws.channel.service';
import { eventEmitterType } from 'src/utilities/enum/env.enum';
import { OnEvent } from '@nestjs/event-emitter';
import { ConvertSimulationType } from 'src/chat-simulation/entities/types.entity';
import { ChatSimulationService } from 'src/chat-simulation/service/chat-simulation.service';
import { EpisodeStatus } from 'src/chat-simulation/enums/chat-simuation.enum';

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
  namespace: 'ws/channel',
})
export class WsChannelGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsService.name);

  constructor(
    private readonly wsChannelService: WsChannelService,
    private readonly chatSimulationService: ChatSimulationService,
  ) {}

  // Called when the WebSocket gateway has been initialized
  afterInit(server: Server) {
    this.logger.log('WsPlayerGateway initialized');
  }

  // Called when a client connects to the WebSocket server
  async handleConnection(client: Socket) {
    try {
      await this.wsChannelService.handleConnection(client);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Called when a client disconnects from the WebSocket server
  async handleDisconnect(client: Socket) {
    try {
      await this.wsChannelService.handleDisconnect(client);
    } catch (error) {}
  }

  // Stream simulation
  @OnEvent(eventEmitterType.LIVE_EPISODE)
  async liveEpisode(
    episodeUUID: string,
    joinCode: string,
    simulation: ConvertSimulationType[],
  ) {
    try {
      if (!joinCode || !simulation?.length) return;

      let index = 0;

      const intervalId = setInterval(async () => {
        if (index < simulation.length) {
          const time = new Date().toISOString();

          this.server
            .to(joinCode)
            .emit('liveEpisode', { ...simulation[index], time });

          if (simulation[index]) {
            await this.chatSimulationService.updateCompletedSimulation(
              episodeUUID,
              { ...simulation[index], time },
            );
          }

          index++;
        } else {
          clearInterval(intervalId); // Stop streaming when data is exhausted

          // Update episode status to posted
          const { status } =
            await this.chatSimulationService.changeEpisodeStatus(
              episodeUUID,
              EpisodeStatus.POSTED,
            );

          this.server.to(joinCode).emit('episodeStatus', { status });
        }
      }, 5000); // Emit every 5 seconds
    } catch (error) {
      this.logger.log('Error emitting liveEpisode:', error.message);
    }
  }
}
