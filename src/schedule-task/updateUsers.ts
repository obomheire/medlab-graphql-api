import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserService } from 'src/user/service/user.service';

@Injectable()
export class UpdateUsersService {
  private readonly logger = new Logger(UpdateUsersService.name);

  constructor(private userService: UserService) {
    this.logger.log('UpdateUsersService instantiated');
  }

  // Shedule a cron task that will run and send email to all users
  // @Cron('53 13  * * *') // run the cron @ 01:46 pm
  async updateAllUsers() {
    this.logger.log('Cron job started');
    try {
      const BATCH_SIZE = 500; // Define the batch size
      const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes interval in milliseconds
      let offset = 0;
      let totalUsers = 0;

      while (true) {
        const users = await this.userService.getUsers(offset, BATCH_SIZE);

        if (users.length === 0) {
          this.logger.log(`Successfully updated ${totalUsers} users`);

          this.logger.log('Cron job completed successfully');

          return;
        }

        // Use map to update user's token balance asynchronously
        await Promise.all(
          users.map(async (user) => {
            this.logger.log({
              email: user.email,
              firstName: user.firstName,
            });
          }),
        );

        this.logger.log(`Updated token balance for ${users.length} users`);

        offset += BATCH_SIZE; // Move to the next batch
        totalUsers += users.length; // Counter

        // Wait for the specified interval before fetching the next batch
        await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
