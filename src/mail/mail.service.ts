import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  sendMail = async (
    text: string,
    html: string,
    recipient: string,
    subject: string,
  ) => {
    const transporter: Transporter<SMTPTransport.SentMessageInfo> =
      createTransport({
        host: 'smtp.zoho.com',
        secure: true,
        port: 465,
        auth: {
          user: process.env.NODEMAILER_USER,
          pass: process.env.NODEMAILER_PASS,
        },
      });

    const mailOptions = {
      from: process.env.NODEMAILER_USER,
      to: recipient,
      subject,
      text,
      html,
    };

    // send mail
    try {
      const response: SMTPTransport.SentMessageInfo =
        await transporter.sendMail(mailOptions);
    } catch (error) {}
  };
}
