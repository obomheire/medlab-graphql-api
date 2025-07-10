import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { GameRes } from '../types/quiz.types';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { GameService } from '../service/game.service';
import { GameInput } from '../dto/game.input';
import { UserDocument } from 'src/user/entity/user.entity';
import { GuestGuard } from 'src/auth/guard/guest.guard';

@Resolver()
export class GameResolver {
  constructor(private readonly gameService: GameService) {}

  // Get random questions from the database
  @UseGuards(AccessTokenAuthGuard, GuestGuard)
  @Mutation(() => GameRes)
  async createGame(
    @GetUser() user: UserDocument,
    @Args('gameInput') gameInput: GameInput,
  ) {
    return await this.gameService.createGame(user, gameInput);
  }
}
