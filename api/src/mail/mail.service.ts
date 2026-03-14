import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.ethereal.email',
      port: Number(process.env.MAIL_PORT) || 587,
      auth: {
        user: process.env.MAIL_USER || 'ethereal_user',
        pass: process.env.MAIL_PASS || 'ethereal_pass',
      },
    });
  }

  async sendWelcomeEmail(email: string, fullName: string) {
    this.logger.log(`Queueing welcome email for ${email}`);

    const templatePath = path.join(
      __dirname,
      'templates',
      'welcome-email.html',
    );
    const heroImagePath = path.join(__dirname, 'assets', 'welcome-hero.png');

    let htmlContent = '';
    try {
      htmlContent = fs.readFileSync(templatePath, 'utf8');
      htmlContent = htmlContent.replace('{{fullName}}', fullName);
      // Replace the local URL with CID for attachment
      htmlContent = htmlContent.replace(
        /https:\/\/raw\.githubusercontent\.com\/.*\.png/g,
        'cid:welcome-hero',
      );
    } catch (error) {
      this.logger.error(`Failed to read email template`, error);
      // Fallback to basic HTML if template fails
      htmlContent = `<h1>Welcome to StreamFlow, ${fullName}!</h1><p>We are glad to have you with us.</p>`;
    }

    const mailOptions = {
      from: '"StreamFlow" <no-reply@streamflow.com>',
      to: email,
      subject: 'Welcome to StreamFlow!',
      text: `Hi ${fullName},\n\nWelcome to StreamFlow! We are glad to have you with us.\n\nBest regards,\nThe StreamFlow Team`,
      html: htmlContent,
      attachments: fs.existsSync(heroImagePath)
        ? [
            {
              filename: 'welcome-hero.png',
              path: heroImagePath,
              cid: 'welcome-hero', // same cid value as in the html img src
            },
          ]
        : [],
    };

    try {
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.ENABLE_MAIL === 'true'
      ) {
        const info = (await this.transporter.sendMail(mailOptions)) as {
          messageId: string;
        };
        this.logger.log(`Email sent: ${info.messageId}`);
      } else {
        this.logger.log(
          `[DEVELOPMENT] Email would be sent to ${email} with content: ${mailOptions.text}`,
        );
        // In dev, we might want to save the HTML to a file to preview it
        const previewPath = path.join(
          process.cwd(),
          'logs',
          `welcome-email-preview-${Date.now()}.html`,
        );
        if (!fs.existsSync(path.dirname(previewPath))) {
          fs.mkdirSync(path.dirname(previewPath), { recursive: true });
        }
        fs.writeFileSync(previewPath, htmlContent);
        this.logger.log(`[DEVELOPMENT] HTML preview saved to ${previewPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, error);
    }
  }
}
