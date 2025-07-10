import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, default as SendGrid } from '@sendgrid/mail';

@Injectable()
export class SendGridClient {
  constructor(private configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async send(mailData: MailDataRequired): Promise<void> {
    try {
      await SendGrid.send(mailData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
