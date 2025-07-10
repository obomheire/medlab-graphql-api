import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketUser } from 'src/utilities/interface/interface';
import { WsException } from '@nestjs/websockets';
import { GameService } from 'src/quiz/service/game.service';
import { WsService } from './ws.service';
import { SubmitAnsDto } from '../dto/ws.dto';
import { GameStateType } from 'src/quiz/enum/quiz.enum';

@Injectable()
export class WsPalyerService {
  private rooms: {
    [key: string]: {
      count: number;
      countdown: number;
      interval?: NodeJS.Timeout;
    };
  } = {};

  constructor(
    private readonly gameService: GameService,
    private readonly wsService: WsService,
  ) {}

  // Get client user and validate
  private getClientUser(client: Socket): SocketUser {
    const clientUser: SocketUser = client['user'];

    if (!clientUser)
      throw new WsException('Could not find client room or name!');

    return clientUser;
  }

  // Handle connection
  async handleConnection(client: Socket) {
    try {
      const { userUUID, firstName, code, url, plan } =
        await this.wsService.validateClient(client);

      if (!code) throw new WsException('Join code not provided!'); // Check if its a multiplayer client

      await this.gameService.getGameByCode(code as string); // Check that code is correct

      client['user'] = {
        userUUID,
        firstName,
        code,
        url,
        plan,
      } as SocketUser;

      // client['user'] = { userUUID, firstName, code };
      client.join(code); // Add client to the room
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle disconnection
  async handleDisconnect(client: Socket) {
    try {
      const { userUUID, code } = this.getClientUser(client);

      // Remove the player from the game's playerUUIDs array
      await this.gameService.removePlayerFromGame(userUUID, code, true);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle fetch game
  async fetchGame(client: Socket) {
    try {
      const { code } = this.getClientUser(client);

      const game = await this.gameService.getGameByCode(code as string);

      return { game, code };
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle join game
  async joinGame(client: Socket) {
    try {
      const { userUUID, firstName, code, url, plan } =
        this.getClientUser(client);

      // Add the player to the game's player array
      await this.gameService.addPlayerToGame(
        userUUID,
        firstName,
        code,
        url,
        plan,
      );

      return { firstName, code };
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle leave game
  async leaveGame(client: Socket) {
    try {
      const { userUUID, firstName, code } = this.getClientUser(client);

      await this.gameService.removePlayerFromGame(userUUID, code); // Remove the player from the game's playerUUIDs array and playerScore

      client.leave(code);
      client.disconnect();

      return { firstName, code };
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle start game event
  async startGame(client: Socket) {
    try {
      const { code, userUUID, firstName } = this.getClientUser(client);

      await this.gameService.updateGameState(
        code,
        GameStateType.STARTED,
        userUUID,
      );

      return { code, firstName };
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch questions event
  async fetchQuestions(server: Server, client: Socket) {
    try {
      const { code } = this.getClientUser(client);

      const questions = await this.gameService.playGame(code);

      // Emit all questions at once
      server.to(code).emit('getQuestions', questions);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle start count down event
  async startCountDown(server: Server, client: Socket) {
    try {
      const { userUUID, code } = this.getClientUser(client);

      this.rooms[code] = {
        count: 0,
        countdown: 20,
      };

      const game = await this.gameService.getGameByCode(code);

      if (game.isCDStart) throw new WsException('Countdown already started');

      if (userUUID !== game.creatorUUID)
        throw new WsException('Only creator can start the count down');

      game.isCDStart = true;
      await game.save();

      const questionCount = game?.questionUUIDs?.length;

      const interval = setInterval(async () => {
        if (this.rooms[code]?.countdown <= 0) {
          if (this.rooms[code]?.count < questionCount - 1) {
            await this.gameService.updateGameState(code, GameStateType.ONGOING);

            server.to(code).emit('getCountdown', {
              count: this.rooms[code]?.count,
              countdown: 20,
              status: 'game-pause',
            }); // Emit game pause
            this.rooms[code].countdown = 20;
            this.rooms[code].count++;
          } else {
            await this.gameService.updateGameState(
              code,
              GameStateType.COMPLETED,
            );

            server.to(code).emit('getCountdown', {
              count: this.rooms[code]?.count,
              countdown: 0,
              status: 'game-end',
            }); // emit game end
            clearInterval(this.rooms[code]?.interval);

            delete this.rooms[code];
          }
        } else {
          server.to(code).emit('getCountdown', {
            count: this.rooms[code]?.count,
            countdown: this.rooms[code]?.countdown,
            status: 'game-on',
          }); // Emit game on
          this.rooms[code].countdown--;
        }
      }, 1000);
      this.rooms[code].interval = interval;
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle submit response event
  async submitAnswer(
    server: Server,
    submitAnsDto: SubmitAnsDto,
    client: Socket,
  ) {
    try {
      await this.wsService.validateInput(SubmitAnsDto, submitAnsDto);

      const { userUUID, code } = this.getClientUser(client);

      const { game, decelerateCounter } = await this.gameService.updateScores(
        userUUID,
        code,
        submitAnsDto,
      );

      const questionCount = game?.questionUUIDs?.length;

      if (this.rooms[code]?.count < questionCount - 1 && decelerateCounter) {
        this.rooms[code].countdown = 20;
        this.rooms[code].count += 1;

        await this.gameService.updateGameState(code, GameStateType.ONGOING);

        server.to(code).emit('getCountdown', {
          count: this.rooms[code]?.count,
          countdown: 20,
          status: 'game-pause',
        }); // emit game end
      } else {
        if (decelerateCounter) {
          await this.gameService.updateGameState(code, GameStateType.COMPLETED);
          this.rooms[code].countdown = 0;
          server.to(code).emit('getCountdown', {
            count: this.rooms[code]?.count,
            countdown: 0,
            status: 'game-end',
          }); // emit game end
          clearInterval(this.rooms[code]?.interval);

          delete this.rooms[code];
        }
      }

      return { code, game };
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle start game event
  async replayGame(client: Socket) {
    try {
      const {
        code: currentCode,
        userUUID,
        firstName,
      } = this.getClientUser(client);

      const { inviteCode: newCode } = await this.gameService.replayGame(
        currentCode,
        userUUID,
      );

      return { firstName, currentCode, newCode };
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }
}
