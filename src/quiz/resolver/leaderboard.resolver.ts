import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { LeaderBoardService } from '../service/leaderboard.service';
import { MessageRes } from 'src/auth/types/auth.types';
import { LeaderBoardRes } from 'src/user/types/user.types';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { UserDocument } from 'src/user/entity/user.entity';
import { LeaderboardInput } from '../dto/question.input';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class LeaderBoardResolver {
  constructor(private readonly leaderBoardService: LeaderBoardService) {}

  // Get leaderboard component list
  @Query(() => [String])
  async getBoardComponents() {
    return this.leaderBoardService.getBoardComponents();
  }

  // Get general leaderboard
  @Query(() => [LeaderBoardRes])
  async getLeaderBoard(
    @GetUser() user: UserDocument,
    @Args('filterInput') { component, region }: LeaderboardInput,
  ) {
    return await this.leaderBoardService.getLeaderBoard(
      user,
      component,
      region,
    );
  }
}
