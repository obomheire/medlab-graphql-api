import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { GameDocument, GameEntity } from 'src/quiz/entity/game.entity';
import { GameService } from 'src/quiz/service/game.service';

@Injectable()
export class DeleteGameService {
  private readonly logger = new Logger(DeleteGameService.name);

  constructor(private readonly gameService: GameService) {
    this.logger.log('DeleteGameService instantiated');
  }

  // Schedule a cron task that runs once a week and deletes all games where updatedAt is greater than or equal to 7 days
  // @Cron('* * * * *')
  @Cron('0 0 * * 0') // Runs at: Midnight (00:00) every Sunday
  async deleteGamesOlderThan7Days(batchSize = 410) {
    this.logger.log('Cron job started');
    try {
      let totalDeletedCount = 0;
      let gamesToDelete: GameDocument[] = [];

      // Retrieve games to delete in batches
      while (true) {
        gamesToDelete = await this.gameService.getGameToDelete(batchSize);

        if (gamesToDelete.length === 0) {
          break;
        }

        const gameUUIDs = gamesToDelete.map(({ gameUUID }) => gameUUID);

        // Delete games in the current batch
        const deleteResult = await this.gameService.deleteGames(gameUUIDs);

        totalDeletedCount += deleteResult.deletedCount;

        this.logger.log(`Deleted ${deleteResult.deletedCount} games`);

        if (deleteResult.deletedCount < batchSize) {
          break; // No more games to delete
        }
      }

      if (totalDeletedCount === 0) {
        this.logger.log(`No games found to delete`);
      }

      this.logger.log(`${totalDeletedCount} games deleted successfully`);
      this.logger.log('Cron job completed successfully');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
