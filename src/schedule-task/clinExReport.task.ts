import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/service/user.service';
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { clinExReportEmails } from 'src/mail/email.constant';
import { UserEntity } from 'src/user/entity/user.entity';

@Injectable()
export class ClinExReportService {
  private readonly logger = new Logger(ClinExReportService.name);

  constructor(
    private userService: UserService,
    private mailService: MailService,
  ) {
    this.logger.log('ContactUsersService instantiated');
  }

  // @Cron('13 09  * * *') // run the cron @ 09: 13 am
  // @Cron('0 7 * * *') // Run every day At 02:42 PM
  async sendEmailReport() {
    this.logger.log('Cron job started');
    try {
      const clinExUsers = await this.userService.getClinExUsers();

      const activeUsers: UserEntity[] = clinExUsers.filter(
        (user) =>
          user?.stripeClinExCust?.stripeSub?.stripeSubStatus === 'active',
      );

      const now = new Date();
      const yesterday = subDays(now, 1);
      const startOfThisMonth = startOfMonth(now);
      const startOfLastMonth = startOfMonth(subMonths(now, 1));
      const endOfLastMonth = endOfMonth(subMonths(now, 1));
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const newSubs24h = activeUsers.filter(
        (user) => new Date(user.stripeClinExCust.createdAt) > yesterday,
      ).length;

      const subsThisMonth = activeUsers.filter(
        (user) => new Date(user.stripeClinExCust.createdAt) >= startOfThisMonth,
      ).length;

      const subsLastMonth = activeUsers.filter((user) => {
        const created = new Date(user.stripeClinExCust.createdAt);
        return created >= startOfLastMonth && created <= endOfLastMonth;
      }).length;

      const subsThisYear = activeUsers.filter(
        (user) => new Date(user.stripeClinExCust.createdAt) >= startOfYear,
      ).length;

      // Construct dynamic data for the email template
      const dynamicData = {
        totalRegUsers: clinExUsers.length,
        newSubs24h,
        subsThisMonth,
        subsLastMonth,
        subsThisYear,
        reportDate: now.toDateString(),
      };

      await this.mailService.sendMails(clinExReportEmails, dynamicData);

      this.logger.log(
        `Report sent to ${clinExReportEmails.length} recipients.`,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
