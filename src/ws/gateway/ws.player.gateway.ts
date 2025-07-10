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
import { WsPalyerService } from '../service/ws.player.service';
import { SubmitAnsDto } from '../dto/ws.dto';

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
  namespace: 'ws/player',
})
export class WsPlayerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsService.name);

  constructor(private readonly wsPalyerService: WsPalyerService) {}

  // Called when the WebSocket gateway has been initialized
  afterInit(server: Server) {
    this.logger.log('WsPlayerGateway initialized');
  }

  // Called when a client connects to the WebSocket server
  async handleConnection(client: Socket) {
    try {
      await this.wsPalyerService.handleConnection(client);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Called when a client disconnects from the WebSocket server
  async handleDisconnect(client: Socket) {
    try {
      await this.wsPalyerService.handleDisconnect(client);
    } catch (error) {}
  }

  // Handle fetch game
  @SubscribeMessage('fetch-game')
  async fetchGame(@ConnectedSocket() client: Socket) {
    try {
      const response = await this.wsPalyerService.fetchGame(client);

      if (response) {
        const { code, game } = response;

        this.server.to(code).emit('fetchGame', game); // Emit fetchGame event to the room

        return game;
      }
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle join game
  @SubscribeMessage('join-game')
  async joinGame(@ConnectedSocket() client: Socket) {
    try {
      const { firstName, code } = await this.wsPalyerService.joinGame(client);

      const playerName = firstName || 'New Player';

      client.broadcast
        .to(code)
        .emit('joinGame', `${playerName} joined the game`); // Emit joinGame event to the room, excluding the current client
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle leave game
  @SubscribeMessage('leave-game')
  async leaveGame(@ConnectedSocket() client: Socket) {
    try {
      const { firstName, code } = await this.wsPalyerService.leaveGame(client);

      // Emit leaveGame event to the room
      this.server.to(code).emit('leaveGame', `${firstName} left the game`);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle start game event
  @SubscribeMessage('start-game')
  async startGame(@ConnectedSocket() client: Socket) {
    try {
      const response = await this.wsPalyerService.startGame(client);

      if (response) {
        const { code, firstName } = response;

        this.server.to(code).emit('startGame', `${firstName} started the game`);
      }
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch questions event
  @SubscribeMessage('fetch-questions')
  async fetchQuestions(@ConnectedSocket() client: Socket) {
    try {
      return await this.wsPalyerService.fetchQuestions(this.server, client);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle start count down event
  @SubscribeMessage('start-count-down')
  async startCountDown(@ConnectedSocket() client: Socket) {
    try {
      return await this.wsPalyerService.startCountDown(this.server, client);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle submit answer event
  @SubscribeMessage('submit-answer')
  async submitAnswer(
    @MessageBody() submitAnsDto: SubmitAnsDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const response = await this.wsPalyerService.submitAnswer(
        this.server,
        submitAnsDto,
        client,
      );

      if (response) {
        const { code, game } = response;
        this.server.to(code).emit('fetchGame', game);
      }
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle replay game event
  @SubscribeMessage('replay-game')
  async replayGame(@ConnectedSocket() client: Socket) {
    try {
      const response = await this.wsPalyerService.replayGame(client);

      if (response) {
        const { firstName, currentCode, newCode } = response;

        client.broadcast.to(currentCode).emit('replayGame', {
          message: `${firstName} wants to replay the game`,
          code: newCode,
        });

        return newCode;
      }
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }
}
