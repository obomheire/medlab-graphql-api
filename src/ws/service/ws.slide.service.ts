import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketUser } from 'src/utilities/interface/interface';
import { WsException } from '@nestjs/websockets';
import { GameService } from 'src/quiz/service/game.service';
import { WsService } from './ws.service';
import {
  FetchPreDto,
  FetchQuesDto,
  MoveSlideDto,
  PresAnswerDto,
  PresGetResultDto,
} from '../dto/ws.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GameStateType } from 'src/quiz/enum/quiz.enum';
import { PresentationService } from 'src/presentation/service/presentation.service';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from 'src/user/entity/user.entity';
import { Model } from 'mongoose';

@Injectable()
export class WsSlideService {
  private rooms: {
    [key: string]: {
      count: number;
      countdown: number;
      interval?: NodeJS.Timeout;
    };
  } = {};

  constructor(
    private readonly wsService: WsService,
    private readonly gameService: GameService,
    private readonly presentationService: PresentationService,
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserEntity>,
  ) {}

  // Get client user and validate
  private getClientUser(client: Socket): SocketUser {
    const clientUser: SocketUser = client['user'];

    if (!clientUser)
      throw new WsException('Could not find client room or name!');

    return clientUser;
  }

  // Handle connection
  async handleConnection(client: Socket, server?: Server) {
    try {
      const { userUUID, name, inviteCode, url, plan } =
        await this.wsService.validateAudience(client);

      // Check if join code is provided
      if (!inviteCode)
        throw new WsException('Invite code or join link not provided!');

      // Validate inviteCode
      const pres = await this.presentationService.getPresByInviteCode(
        inviteCode,
      );
      const presenter = pres?.userId?.firstName + ' ' + pres?.userId?.lastName;

      client['user'] = {
        userUUID,
        name,
        code: inviteCode,
        url,
        plan,
      } as SocketUser;
      client.join(inviteCode); // Add audience to the room

      // Join audience to the presentation
      await this.joinPresentation(client, {
        userUUID,
        name,
        code: inviteCode,
        url,
        plan,
      });

      const roomClients = await server.in(inviteCode).fetchSockets();
      const users = roomClients.map((socket) => socket['user']);
      const excludePresenter = users.filter((user) => user.name !== presenter);
      client.emit('getPresentationUsers', excludePresenter);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle disconnection
  async handleDisconnect(client: Socket) {
    try {
      const { userUUID, code } = this.getClientUser(client);

      // Remove audience from quiz
      await this.gameService.removePlayerFromGame(userUUID, code, true);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle fetch interactive
  async fetchInteractive(client: Socket) {
    try {
      const { code } = this.getClientUser(client);
      const interactive = await this.gameService.getGameByCode(code as string);
      // console.log(interactive);
      return { interactive, code };
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle join interactive
  async joinPresentation(
    client: Socket,
    { userUUID, name, code, url, plan }: SocketUser,
  ) {
    try {
      // Add the player to the game's player array
      await this.gameService.addPlayerToGame(userUUID, name, code, url, plan);

      const playerName = name || 'New Audience';

      client.broadcast
        .to(code)
        .emit('joinPresentation', `${playerName} joined the presentation`); // Emit joinPresentation event to the room, excluding the current client
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle leave interactive
  async leavePresentation(client: Socket) {
    try {
      const { userUUID, name, code } = this.getClientUser(client);

      await this.gameService.removePlayerFromGame(userUUID, code); // Remove the audience from the game's playerUUIDs array and playerScore

      client.leave(code);
      client.disconnect();

      return { name, code };
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle start interactive event
  async startPresentation(client: Socket) {
    try {
      const { code, userUUID, name } = this.getClientUser(client);

      await this.gameService.updateGameState(
        code,
        GameStateType.STARTED,
        userUUID,
        true,
      );

      return { code, name };
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle start interactive event
  async endPresentation(client: Socket) {
    try {
      const { code, userUUID, name } = this.getClientUser(client);

      await this.gameService.updateGameState(
        code,
        GameStateType.COMPLETED,
        userUUID,
        true,
      );

      return { code, name };
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch questions event
  async fetchQuestions(
    server: Server,
    client: Socket,
    fetchQuesDto: FetchQuesDto,
  ) {
    try {
      await this.wsService.validateInput(FetchQuesDto, fetchQuesDto);

      const { questionType } = fetchQuesDto;

      const { code } = this.getClientUser(client);

      const questions = await this.presentationService.getPresByInviteCode(
        code,
        questionType,
      );

      // Emit all questions at once
      server.to(code).emit('getQuestions', questions[0]?.questions || []);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  async fetchNextQuestion(
    server: Server,
    client: Socket,
    fetchQuesDto: FetchQuesDto,
  ) {
    try {
      await this.wsService.validateInput(FetchQuesDto, fetchQuesDto);

      const { questionType } = fetchQuesDto;

      const { code } = this.getClientUser(client);

      const nextQuestion = await this.presentationService.getPresNextQuestion(
        code,
        questionType,
      );

      // Emit all questions at once
      server.to(code).emit('getNextQuestion', nextQuestion[0]);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch total questions both played and all questions in the presentation
  async getTotalQuestions(
    server: Server,
    client: Socket,
    questionType: string,
  ) {
    try {
      const { code } = this.getClientUser(client);

      const questions = await this.presentationService.getTotalQuestions(
        code,
        questionType,
      );

      // Emit all questions at once
      server.to(code).emit('getTotalQuestions', questions);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  //Method for handling countdown
  async startCountDown(server: Server, client: Socket, time: number) {
    try {
      const { code } = this.getClientUser(client);

      const interval = setInterval(async () => {
        if (time > 0) {
          server.to(code).emit('getPreGameCountdown', time--);
        } else {
          clearInterval(interval);
          server.to(code).emit('getPreGameCountdown', 0);
        }
      }, 1000);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }
  // Handle submit response event
  async submitAnswer_v2(
    server: Server,
    submitAnsDto: PresAnswerDto,
    client: Socket,
  ) {
    try {
      await this.validateInput(PresAnswerDto, submitAnsDto);

      const { userUUID, code, name } = this.getClientUser(client);
      const playerDetails = await this.getPlayerByUserUUID(userUUID, name);

      const getPrePreview = await this.presentationService.getPresByInviteCode(
        code,
        submitAnsDto.type,
      );

      await this.gameService.updatePresScores(
        playerDetails,
        code,
        submitAnsDto,
        getPrePreview,
      );

      return { code };
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch presentation result and leaderboard
  async getPresGameResult(
    server: Server,
    presGetResultDto: PresGetResultDto,
    client: Socket,
  ) {
    try {
      await this.validateInput(PresGetResultDto, presGetResultDto);

      const { code } = this.getClientUser(client);
      const { questionUUID, type } = presGetResultDto;
      const getResult = await this.gameService.getPresGameResult(
        code,
        questionUUID,
      );
      const getLeaderboard = await this.gameService.getLeaderboard(code, type);

      server.to(code).emit('getPresGameResult', {
        questionResult: getResult,
        leaderboard: getLeaderboard,
      });
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle fetch presentation event
  async fetchPresentation(
    server: Server,
    client: Socket,
    fetchPreDto: FetchPreDto,
  ) {
    try {
      await this.wsService.validateInput(FetchPreDto, fetchPreDto);

      const { presUUID } = fetchPreDto;

      const { code } = this.getClientUser(client);

      const presentation = await this.presentationService.getPresentation(
        presUUID,
      );

      // Emit all presentation
      server.to(code).emit('fetchPresentation', presentation);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle move next event
  async moveNext(server: Server, client: Socket, moveSlideDto: MoveSlideDto) {
    try {
      await this.wsService.validateInput(MoveSlideDto, moveSlideDto);

      const { code, userUUID } = this.getClientUser(client);

      await this.gameService.updateGame(code, userUUID, moveSlideDto); // Update currentSlide field

      // Emit all presentation
      server.to(code).emit('moveNext', moveSlideDto);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle move back event
  async moveBack(server: Server, client: Socket, moveSlideDto: MoveSlideDto) {
    try {
      await this.wsService.validateInput(MoveSlideDto, moveSlideDto);

      const { code, userUUID } = this.getClientUser(client);

      await this.gameService.updateGame(code, userUUID, moveSlideDto); // Update currentSlide field

      // Emit all presentation
      server.to(code).emit('moveBack', moveSlideDto);
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  //Handle get player by userUUID
  async getPlayerByUserUUID(userUUID: string, name: string) {
    try {
      const player = await this.userModel.findOne({ userUUID });
      let playerData: any;

      if (!player) {
        playerData = {
          userUUID,
          name: name || 'Guest Audience',
          profileImage: null,
        };
      } else {
        playerData = {
          userUUID,
          name: name || player.firstName + ' ' + player.lastName,
          profileImage: player.profileImage,
        };
      }
      return playerData;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Handle submit response event
  async submitAnswer(
    server: Server,
    submitAnsDto: PresAnswerDto,
    client: Socket,
  ) {
    try {
      await this.validateInput(PresAnswerDto, submitAnsDto);

      const { userUUID, code } = this.getClientUser(client);
      const getPrePreview = await this.presentationService.getPresByInviteCode(
        code,
        null,
      );

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

  async validateInput(DtoClass: any, data: any): Promise<string | null> {
    const dto = plainToInstance(DtoClass, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessage = errors
        .map((err) => Object.values(err.constraints))
        .flat();

      const validationError = errorMessage[0];

      if (validationError) {
        throw new WsException(validationError);
      }
    }
    return null; // Indicates validation success
  }
}
