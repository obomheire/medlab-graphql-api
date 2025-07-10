import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { GameDocument, GameEntity } from '../entity/game.entity';
import ShortUniqueId from 'short-unique-id';
import { QuestionService } from './question.service';
import { GameInput } from '../dto/game.input';
import { UserService } from 'src/user/service/user.service';
import { Score, TotalRes } from '../entity/type.entity';
import { MoveSlideDto, PresAnswerDto, SubmitAnsDto } from 'src/ws/dto/ws.dto';
import { EngageType, GameStateType } from '../enum/quiz.enum';
import { names } from 'src/utilities/constant/utils.costant';
import { WsException } from '@nestjs/websockets';
import { QuestionEntity } from '../entity/questions.entity';
import { UserDocument } from 'src/user/entity/user.entity';
import { ObjectId } from 'mongodb';
import { PreviewInp } from 'src/presentation/dto/presentation.input';
import {
  PresentationDocument,
  PresentationEntity,
} from 'src/presentation/entity/presentation.entity';

@Injectable()
export class GameService {
  private readonly uid = new ShortUniqueId({ length: 6 });
  private readonly names = names;

  constructor(
    @InjectModel(GameEntity.name)
    private readonly gameModel: Model<GameDocument>,
    private readonly questionService: QuestionService,
    private readonly userService: UserService,
  ) {}

  // Get questions by subcategory
  async createGame(
    user: UserDocument,
    gameInput: GameInput,
    joinCode?: string,
  ): Promise<{ inviteCode: string }> {
    try {
      const { isMedQues, questionUUIDs, totalQuestion } = gameInput;

      if (
        isMedQues?.status &&
        !isMedQues?.subcategory?.length &&
        !isMedQues?.quizUUID
      )
        throw new WsException(
          'At least one subcategory ID or quiz UUID is required for the medscroll question',
        );

      if (!isMedQues?.status && !questionUUIDs?.length)
        throw new WsException(
          'questionUUIDs is required for the question bank',
        );

      const {
        userUUID: creatorUUID,
        firstName,
        profileImage,
        subscription: { plan },
      } = user;

      // Generate the game code
      const inviteCode = joinCode || this.uid.rnd();

      const playerScore: Score = {
        userUUID: creatorUUID,
        firstName,
        plan,
        url: profileImage || null,
        speed: 0,
        speedBonus: 0,
        score: 0,
        correct: 0,
        incorrect: 0,
      };

      const playerScores: Map<string, Score> = new Map([
        [`${creatorUUID}`, playerScore],
      ]);

      const game: GameEntity = {
        ...gameInput,
        questionUUIDs: questionUUIDs?.length
          ? questionUUIDs
          : isMedQues?.quizUUID
          ? (
              await this.questionService.getGameQues(
                creatorUUID,
                isMedQues.quizUUID,
              )
            ).map((item: QuestionEntity) => item?.questionUUID)
          : await this.questionService.getQuestionIds(
              isMedQues?.subcategory,
              totalQuestion,
            ),
        totalQuestion: isMedQues?.status
          ? totalQuestion || 10
          : questionUUIDs.length,
        playerScores,
        playersUUIDs: [creatorUUID],
        responses: new Map<string, TotalRes>(),
        creatorUUID,
        inviteCode,
        maxPlayers: plan === 'premium' ? 100 : plan === 'pro' ? 50 : 10,
        currentSlide: null,
      };

      const newGame = new this.gameModel(game);
      await newGame.save();

      return { inviteCode };
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Get game by code
  async getGameByCode(inviteCode: string): Promise<GameDocument> {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      // Fetch the game using the invite code
      const game = await this.gameModel.findOne({ inviteCode }).exec();

      if (!game) throw new WsException('Invalid game code!');

      return game;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Add player to game
  async addPlayerToGame(
    userUUID: string,
    firstName: string,
    inviteCode: string,
    url: string,
    plan: string,
  ): Promise<void> {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      // Get game
      const game = await this.getGameByCode(inviteCode);

      // Check if game room has reached its maximum capacity.
      if (game?.playersUUIDs?.length === game?.maxPlayers)
        throw new WsException(
          'Sorry this game room has reached its maximum capacity',
        );

      if (!game?.playerScores.has(userUUID)) {
        // Check if the client is not already connected
        game.playerScores.set(userUUID, {
          userUUID,
          firstName,
          plan,
          url,
          speed: 0,
          speedBonus: 0,
          score: 0,
          correct: 0,
          incorrect: 0,
        });
      }

      if (!game?.playersUUIDs.includes(userUUID))
        game?.playersUUIDs.unshift(userUUID);

      await game.save();
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Remove player from game
  async removePlayerFromGame(
    userUUID: string,
    inviteCode: string,
    isDisconnect?: boolean,
  ): Promise<void> {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      // Get game
      const game = await this.getGameByCode(inviteCode);

      if (!isDisconnect) game?.playerScores.delete(userUUID);

      // Remove the player from the playerUUIDs array
      game.playersUUIDs = game?.playersUUIDs.filter(
        (item) => item !== userUUID,
      );

      await game.save();
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Play game
  async playGame(inviteCode: string) {
    try {
      if (!inviteCode) return [];

      // Fetch the game details using the invite code
      const game = await this.getGameByCode(inviteCode);

      return await this.questionService.getGameQuestions(game.questionUUIDs);
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Submit response
  async updateScores(
    userUUID: string,
    inviteCode: string,
    submitAnsDto: SubmitAnsDto,
  ) {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      const { speed, isCorrect, questionUUID } = submitAnsDto;

      // Fetch the game details using the invite code
      const getGame = await this.getGameByCode(inviteCode);

      // Check if the userUUID exists in the playerScores
      if (!getGame.playerScores.has(userUUID)) {
        throw new WsException('Player not found');
      }

      if (!getGame.responses.has(questionUUID)) {
        getGame.responses.set(questionUUID, { totalRes: 1 });
      } else {
        const totalRes = getGame.responses.get(questionUUID);
        totalRes.totalRes += 1;
        getGame.responses.set(questionUUID, totalRes);
      }

      // Update the player's score
      const playerScore = getGame.playerScores.get(userUUID);
      const speedBonus = isCorrect && speed <= 8 ? 2 : 0;
      playerScore.speedBonus += speedBonus;
      playerScore.speed += speed || 0;
      playerScore.score += isCorrect ? 1 + speedBonus : 0;
      playerScore.correct += isCorrect ? 1 : 0;
      playerScore.incorrect += isCorrect ? 0 : 1;

      // Save the updated player score back to the map
      getGame.playerScores.set(userUUID, playerScore);

      // Save the updated game details
      const game = await getGame.save();

      // Compare playerScores size with the totalRes value
      const decelerateCounter =
        game.playerScores.size === game.responses.get(questionUUID).totalRes;

      return { game, decelerateCounter };
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Submit Pres response
  async updatePresScores(
    playerDetails: {
      userUUID: string;
      name: string;
      profileImage: string;
    },
    inviteCode: string,
    submitAnsDto: PresAnswerDto,
    presPreview: PresentationDocument,
  ) {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      const { answerPoints } = presPreview[0];
      const {
        speed,
        correctAnwser,
        type,
        optionPicked,
        isCorrect,
        questionUUID,
        question,
        options,
      } = submitAnsDto;

      // Fetch the game details using the invite code
      const getGame = await this.getGameByCode(inviteCode);
      if (!getGame) throw new WsException('Game not found');

      // Check if question already exists in presScores
      const foundQuestion = getGame.presScores.find(
        (pres) => pres.presQuestionUUID === questionUUID,
      );

      const userScore = {
        optionPicked,
        score: Number(isCorrect ? answerPoints : 0),
        speed: speed || 0,
        speedBonus: isCorrect && speed <= 8 ? 2 : 0,
        type,
        ...playerDetails,
      };

      if (foundQuestion) {
        const userExists = foundQuestion.userScores.some(
          (user) => user.userUUID === playerDetails.userUUID,
        );

        if (!userExists) {
          getGame.presScores.filter((pres) => {
            if (pres.presQuestionUUID === questionUUID) {
              pres.userScores.push(userScore);
            }
            return pres;
          });
          getGame.markModified('presScores');
          getGame.save();
        }
      } else {
        // If question does not exist, create a new record
        getGame.presScores.push({
          presQuestionUUID: questionUUID,
          correctAnswer: correctAnwser,
          question,
          options,
          type, // This is the engagement type, either quiz or poll
          userScores: [userScore],
        });
        await getGame.save();
      }

      // Fetch updated result
      return 'success';
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Method for played question
  async fetchPlayedPresQuestion(inviteCode: string) {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      // Fetch the game details using the invite code
      const getGame = await this.getGameByCode(inviteCode);
      if (!getGame) throw new WsException('Game not found');

      return getGame.presScores;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  //Method to get game result and leaderboard
  async getPresGameResult(inviteCode: string, presQuestionUUID: string) {
    try {
      const checkGame = await this.gameModel
        .findOne({
          inviteCode,
        })
        .select('presScores');

      const newData = checkGame?.presScores?.filter(
        (pres) => pres.presQuestionUUID === presQuestionUUID,
      );
      return newData;
    } catch (error) {
      throw new WsException(error?.message);
    }
  }

  async getLeaderboard(inviteCode: string, engagementType: EngageType) {
    try {
      const leaders = await this.gameModel
        .findOne({ inviteCode })
        .select('presScores');
      const newData = leaders?.presScores?.filter(
        (pres) => pres.type === engagementType,
      );
      return newData;
    } catch (error) {
      throw new WsException(error?.message);
    }
  }

  async updateGameState(
    inviteCode: string,
    gameState: GameStateType,
    userUUID?: string,
    isPresentation?: boolean,
  ): Promise<void> {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      // Fetch the game using the invite code
      const game = await this.getGameByCode(inviteCode);

      if (!isPresentation) {
        if (game?.questionUUIDs?.length === game?.answeredQuestion) return; // Check if the game is already completed
      }

      switch (gameState) {
        case GameStateType.STARTED:
          if (userUUID !== game.creatorUUID) {
            const context = isPresentation ? 'presentation' : 'game';
            throw new WsException(`Only creator can start the ${context}`);
          }

          game.currentSlide = isPresentation
            ? {
                id: 0,
                type: 'cover',
              }
            : null;

          game.gameState = GameStateType.STARTED;
          break;

        case GameStateType.COMPLETED:
          if (isPresentation && userUUID !== game.creatorUUID) {
            throw new WsException(`Only creator can end the interactive`);
          }

          game.gameState = GameStateType.COMPLETED;

          game.answeredQuestion += 1;
          break;

        case GameStateType.ONGOING:
          if (game.gameState !== GameStateType.ONGOING)
            game.gameState = GameStateType.ONGOING;

          game.answeredQuestion += 1;
          break;

        default:
          break;
      }

      await game.save();
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Update game
  async updateGame(
    inviteCode: string,
    userUUID: string,
    moveSlideDto: MoveSlideDto,
  ): Promise<void> {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      // Fetch the game using the invite code
      const game = await this.getGameByCode(inviteCode);

      if (userUUID !== game.creatorUUID) {
        throw new WsException(`Only creator can move the presentation`);
      }

      game.currentSlide = moveSlideDto;

      await game.save();
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Get questions by subcategory
  async replayGame(
    inviteCode: string,
    userUUID: string,
  ): Promise<{ inviteCode: string }> {
    try {
      const { playerScores, topic, questionUUIDs, totalQuestion, isMedQues } =
        await this.getGameByCode(inviteCode);

      // Update the player's score
      const player = playerScores.get(userUUID);

      const { firstName, url, plan } = player;

      // Generate the game code
      const newInviteCode = this.uid.rnd();

      const playerScore: Score = {
        userUUID,
        firstName,
        plan,
        url,
        speed: 0,
        speedBonus: 0,
        score: 0,
        correct: 0,
        incorrect: 0,
      };

      const newPlayerScores: Map<string, Score> = new Map([
        [`${userUUID}`, playerScore],
      ]);

      const game: GameEntity = {
        topic,
        questionUUIDs,
        totalQuestion,
        playerScores: newPlayerScores,
        playersUUIDs: [userUUID],
        responses: new Map<string, TotalRes>(),
        creatorUUID: userUUID,
        inviteCode: newInviteCode,
        isMedQues,
        maxPlayers: plan === 'premium' ? 100 : plan === 'pro' ? 50 : 10,
        currentSlide: null,
      };

      const newGame = new this.gameModel(game);
      await newGame.save();

      return { inviteCode: newInviteCode };
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Create audience game
  async createAudienceGame(
    user: UserDocument,
    presId: ObjectId,
    inviteCode: string,
    engagement: PreviewInp[],
  ): Promise<{ inviteCode: string }> {
    try {
      const {
        userUUID: creatorUUID,
        firstName,
        profileImage,
        subscription: { plan },
      } = user;

      const playerScore: Score = {
        userUUID: creatorUUID,
        firstName,
        plan,
        url: profileImage || null,
        speed: 0,
        speedBonus: 0,
        score: 0,
        correct: 0,
        incorrect: 0,
      };

      const playerScores: Map<string, Score> = new Map([
        [`${creatorUUID}`, playerScore],
      ]);

      const game: GameEntity = {
        creatorUUID,
        presId,
        playerScores,
        playersUUIDs: [creatorUUID],
        responses: new Map<string, TotalRes>(),
        presEngagement: engagement,
        inviteCode,
        currentSlide: null,
      };

      const newGame = new this.gameModel(game);
      await newGame.save();

      return { inviteCode };
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Add player to game
  async addAudienceToGame(
    userUUID: string,
    name: string,
    inviteCode: string,
  ): Promise<void> {
    try {
      if (!inviteCode) throw new WsException('Game code is required');

      const {
        firstName,
        lastName,
        profileImage: url,
        subscription: { plan },
      } = await this.userService.getUserByUUID(userUUID);

      // Get game
      const game = await this.getGameByCode(inviteCode);

      if (!game?.playerScores.has(userUUID)) {
        // Check if the client is not already connected
        game.playerScores.set(userUUID, {
          userUUID,
          firstName,
          plan,
          url,
          speed: 0,
          speedBonus: 0,
          score: 0,
          correct: 0,
          incorrect: 0,
        });
      }

      if (!game?.playersUUIDs.includes(userUUID))
        game?.playersUUIDs.unshift(userUUID);

      await game.save();
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Get game by code
  async getGameToDelete(batchSize: number): Promise<GameDocument[]> {
    try {
      return await this.gameModel
        .find({
          updatedAt: {
            $lte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        })
        .limit(batchSize)
        .exec(); // Using index
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get game by code
  async deleteGames(gameUUIDs: string[]) {
    try {
      return await this.gameModel.deleteMany({
        gameUUID: { $in: gameUUIDs },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
