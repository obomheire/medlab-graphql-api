import { BadRequestException, Injectable } from '@nestjs/common';
import { MailDataRequired } from '@sendgrid/mail';
import { SendGridClient } from './sendgrid-client';
import { ConfigService } from '@nestjs/config';
import { MailData } from 'src/utilities/interface/interface';
import { ContactUsInput } from 'src/user/dto/user.input';
import { dynamicTemplates } from './email.constant';

@Injectable()
export class MailService {
  constructor(
    private readonly sendGridClient: SendGridClient,
    private configService: ConfigService,
  ) {}

  async sendMail(
    recipient: string,
    { firstName, otp, templateId }: MailData,
  ): Promise<void> {
    try {
      const mailData: MailDataRequired = {
        to: recipient,
        // cc: 'example@mail.com',
        from: {
          name: 'MedScroll',
          email: this.configService.get<string>('SENDGRID_EMAIL_FROM'),
        },
        // asm: {
        //   groupId: 26425,
        // },
        templateId,
        dynamicTemplateData: { firstName, otp },
      };

      await this.sendGridClient.send(mailData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async sendMails(recipients: string[], dynamicData: any): Promise<void> {
    try {
      const mailData: MailDataRequired = {
        to: recipients,
        from: {
          name: 'Medscroll',
          email: this.configService.get<string>('SENDGRID_EMAIL_FROM'),
        },
        templateId: dynamicTemplates.clinExSubReportTemplate, // New pdate email temlate
        dynamicTemplateData: dynamicData,
      };

      await this.sendGridClient.send(mailData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async emailContactUs(contactUsInput: ContactUsInput): Promise<void> {
    try {
      const { firstName, email, phoneNumber, message } = contactUsInput;
      const mailData: MailDataRequired = {
        to: this.configService.get<string>('SENDGRID_EMAIL_TO'),
        from: {
          name: 'MedScroll',
          email: this.configService.get<string>('SENDGRID_EMAIL_FROM'),
        },
        templateId: dynamicTemplates.contactUsTemplate,
        dynamicTemplateData: { firstName, email, phoneNumber, message },
      };

      await this.sendGridClient.send(mailData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async sendgridMail(recipient: string, firstName: string): Promise<void> {
    try {
      const mailData: MailDataRequired = {
        to: recipient,
        // cc: 'example@mail.com',
        from: {
          name: 'Medscroll',
          email: this.configService.get<string>('SENDGRID_EMAIL_FROM'),
        },
        asm: {
          groupId: 26872, // New update unsubscribe group
          // groupId: 27611, // Contact users unsubscribe group
        },
        // templateId: dynamicTemplates.newUpdateTemplate, // New pdate email temlate
        templateId: dynamicTemplates.contactUsersTemplate, // Contact users email template
        dynamicTemplateData: { firstName },
        // hideWarnings: true, // No warning will be logged
      };

      await this.sendGridClient.send(mailData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
