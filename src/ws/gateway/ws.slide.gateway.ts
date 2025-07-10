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
import {
  FetchPreDto,
  FetchQuesDto,
  MoveSlideDto,
  PresAnswerDto,
  PresGetResultDto,
  SubmitAnsDto,
} from '../dto/ws.dto';
import { WsSlideService } from '../service/ws.slide.service';

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
  namespace: 'ws/slide',
})
export class WsSlideGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsService.name);

  constructor(private readonly wsSlideService: WsSlideService) {}

  // Called when the WebSocket gateway has been initialized
  afterInit(server: Server) {
    this.logger.log('WsSlideGateway initialized');
  }

  // Called when a client connects to the WebSocket server
  async handleConnection(client: Socket) {
    try {
      await this.wsSlideService.handleConnection(client, this.server);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Called when a client disconnects from the WebSocket server
  async handleDisconnect(client: Socket) {
    try {
      await this.wsSlideService.handleDisconnect(client);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle fetch interactive
  @SubscribeMessage('fetch-interactive')
  async fetchInteractive(@ConnectedSocket() client: Socket) {
    try {
      const response = await this.wsSlideService.fetchInteractive(client);
      if (response) {
        const { code, interactive } = response;

        this.server.to(code).emit('fetchInteractive', interactive); // Emit fetchInteractive event to the room

        return interactive;
      }
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle leave interactive
  @SubscribeMessage('leave-presentation')
  async leavePresentation(@ConnectedSocket() client: Socket) {
    try {
      const { name, code } = await this.wsSlideService.leavePresentation(
        client,
      );

      this.server
        .to(code)
        .emit('leavePresentation', `${name} left the presentation`); // Emit leavePresentation event to the room
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle start interactive event
  @SubscribeMessage('start-presentation')
  async startPresentation(@ConnectedSocket() client: Socket) {
    try {
      const response = await this.wsSlideService.startPresentation(client);

      if (response) {
        const { code, name } = response;

        this.server
          .to(code)
          .emit('startPresentation', `${name} started the presentation`);
      }
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle end interactive event
  @SubscribeMessage('end-presentation')
  async endPresentation(@ConnectedSocket() client: Socket) {
    try {
      const response = await this.wsSlideService.endPresentation(client);

      if (response) {
        const { code, name } = response;

        this.server
          .to(code)
          .emit(
            'endPresentation',
            `${name} ended the presentation. You will be disconnected in ...`,
          );

        let countdown = 11;

        // Emit the countdown every second
        const interval = setInterval(() => {
          countdown -= 1;
          this.server.to(code).emit('countdown', countdown);

          // Clear the interval when countdown reaches 0
          if (countdown <= 0) {
            clearInterval(interval);
          }
        }, 1000);

        // Disconnect all client after 11 seconds
        setTimeout(() => {
          this.server.in(code).disconnectSockets(true);
        }, 11000); // 11000 ms = 11 seconds
      }
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch questions event
  @SubscribeMessage('fetch-questions')
  async fetchQuestions(
    @ConnectedSocket() client: Socket,
    @MessageBody() fetchQuesDto: FetchQuesDto,
  ) {
    try {
      return await this.wsSlideService.fetchQuestions(
        this.server,
        client,
        fetchQuesDto,
      );
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch total questions both played and all questions in the presentation
  @SubscribeMessage('fetch-total-questions')
  async fetchTotalQuestions(
    @ConnectedSocket() client: Socket,
    @MessageBody('questionType') questionType: string,
  ) {
    try {
      return await this.wsSlideService.getTotalQuestions(
        this.server,
        client,
        questionType,
      );
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch next question event
  @SubscribeMessage('fetch-next-question')
  async fetchNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() fetchQuesDto: FetchQuesDto,
  ) {
    return await this.wsSlideService.fetchNextQuestion(
      this.server,
      client,
      fetchQuesDto,
    );
  }

  // Handle start countdown event
  @SubscribeMessage('start-pres-countdown')
  async startCountdown(
    @ConnectedSocket() client: Socket,
    @MessageBody('time') time: number,
  ) {
    return await this.wsSlideService.startCountDown(this.server, client, time);
  }

  // Handle submit answer event
  @SubscribeMessage('submit-answer')
  async submitAnswer_v2(
    @MessageBody() submitAnsDto: PresAnswerDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const response = await this.wsSlideService.submitAnswer_v2(
        this.server,
        submitAnsDto,
        client,
      );

      if (response) {
        const { code } = response;
        this.server.to(code).emit('fetchGame', response);
      }
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch presentation result and leaderboard
  @SubscribeMessage('fetch-pres-result')
  async fetchPresResult(
    @ConnectedSocket() client: Socket,
    @MessageBody() presGetResultDto: PresGetResultDto,
  ) {
    return await this.wsSlideService.getPresGameResult(
      this.server,
      presGetResultDto,
      client,
    );
  }

  // Handle fetch presentation event
  @SubscribeMessage('fetch-presentation')
  async fetchPresentation(
    @ConnectedSocket() client: Socket,
    @MessageBody() fetchPreDto: FetchPreDto,
  ) {
    try {
      return await this.wsSlideService.fetchPresentation(
        this.server,
        client,
        fetchPreDto,
      );
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle move next event
  @SubscribeMessage('move-next')
  async moveNext(
    @ConnectedSocket() client: Socket,
    @MessageBody() moveSlideDto: MoveSlideDto,
  ) {
    try {
      return await this.wsSlideService.moveNext(
        this.server,
        client,
        moveSlideDto,
      );
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle move back event
  @SubscribeMessage('move-back')
  async moveBack(
    @ConnectedSocket() client: Socket,
    @MessageBody() moveSlideDto: MoveSlideDto,
  ) {
    try {
      return await this.wsSlideService.moveBack(
        this.server,
        client,
        moveSlideDto,
      );
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle replay game event
  @SubscribeMessage('replay-game')
  async replayGame(@ConnectedSocket() client: Socket) {
    try {
      const response = await this.wsSlideService.replayGame(client);

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
