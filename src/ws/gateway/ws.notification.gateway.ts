import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { WsService } from '../service/ws.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsNotificationService } from '../service/ws.notification.service';

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
  namespace: 'ws/notification',
})
export class WsNotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsService.name);

  constructor(
    @Inject(forwardRef(() => WsNotificationService))
    private readonly wsNotificationService: WsNotificationService,
  ) {}

  // Called when the WebSocket gateway has been initialized
  afterInit(server: Server) {
    this.logger.log('WsSlideGateway initialized');
  }

  // Called when a client connects to the WebSocket server
  async handleConnection(client: Socket) {
    try {
      await this.wsNotificationService.handleConnection(client, this.server);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Called when a client disconnects from the WebSocket server
  async handleDisconnect(client: Socket) {
    try {
      await this.wsNotificationService.handleDisconnect(client);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle fetch notification for when slide image generation is complete
  @SubscribeMessage('slide-image-gen-status')
  async slideImageGenStatus(userId: string, data: any) {
    try {
      this.server.to(userId).emit('image-generation-complete', data);
    } catch (error) {
      this.server.emit('error', error.message);
    }
  }
}
