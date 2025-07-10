import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/service/user.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ContactUsersService {
  private readonly logger = new Logger(ContactUsersService.name);
  private readonly filePath = path.join(process.cwd(), 'totalEmailSent.txt');

  constructor(
    private userService: UserService,
    private mailService: MailService,
  ) {
    this.logger.log('ContactUsersService instantiated');
  }

  // Shedule a cron task that will run and send email to all users
  // @Cron('14 17  * * *') // run the cron @ 01:46 pm
  async sendEmailToAllUsers() {
    this.logger.log('Cron job started');
    try {
      const BATCH_SIZE = 400; // Define the batch size
      const INTERVAL_MS = 1 * 60 * 1000; // 1 minutes interval in milliseconds
      let offset = 0;
      let totalUsers = 0;

      while (true) {
        const users = await this.userService.getUsers(offset, BATCH_SIZE);

        if (users.length === 0) {
          this.logger.log('Cron job completed successfully');

          return;
        }

        // Use map to send email to each user asynchronously
        await Promise.all(
          users.map(async (user) => {
            await this.mailService.sendgridMail(
              user.email,
              user?.firstName || 'MedScroll User',
            );

            //   this.logger.log({
            //     email: user.email,
            //     firstName: user?.firstName || 'MedScroll User',
            //   });
          }),
        );

        totalUsers += users.length; // Increase counter

        // Append the total sent emails count to the file
        this.appendTotalEmailsSent(totalUsers);

        offset += BATCH_SIZE; // Move to the next batch

        this.logger.log(
          `Successfully sent email to a total of ${totalUsers} users`,
        );

        // Wait for the specified interval before fetching the next batch
        await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private appendTotalEmailsSent(count: number) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp} - Total emails sent: ${count}\n`;
      fs.appendFileSync(this.filePath, logEntry, 'utf8');
    } catch (error) {
      this.logger.error('Error appending to file', error);
    }
  }
}
