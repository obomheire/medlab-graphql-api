import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import { LeaderBoardService } from 'src/quiz/service/leaderboard.service';
import { UserService } from 'src/user/service/user.service';

@Injectable()
export class LeaderboardSeederService {
  private readonly logger = new Logger(LeaderboardSeederService.name);
  constructor(
    private readonly leaderboardService: LeaderBoardService,
    private readonly userService: UserService,
  ) {
    this.logger.log('LeaderboardSeeder Service instantiated');
  }

  // @Cron('2 * * * * *') // run the cron 2sec
  async insertBoards() {
    const regions = ['United States', 'Canada', 'United Kingdom', 'Nigeria'];
    const components = [
      ComponentType.MEDSYNOPSIS,
      ComponentType.CASE_RECALL,
      ComponentType.MEDICAL_TRIVIA,
    ];

    const ids = [
      '900ded72-476d-4a96-ad86-ab6f7a812c40',
      '07e14e7b-21c3-427d-9b1a-724c8d1d9b49',
      'c05d8650-ba2b-4700-9ebf-d2bf3b9f42a5',
      '7414756e-9153-4cb2-b521-b54b429f8724',
    ];

    // Iterate and process asynchronously
    for (let index = 0; index < 50; index++) {
      const userUUID = ids[Math.floor(Math.random() * ids.length)];
      const user = await this.userService.getUserByUUID(userUUID);

      if (user) {
        await this.leaderboardService.recordScore({
          points: Math.floor(Math.random() * 1000),
          timeTaken: Math.floor(Math.random() * 1000),
          region: regions[Math.floor(Math.random() * regions.length)],
          component: components[Math.floor(Math.random() * components.length)],
          user,
        });
      } else {
        this.logger.warn(`User with UUID ${userUUID} not found.`);
      }
    }

    this.logger.log('LeaderboardSeeder Service completed successfully');
  }
}
