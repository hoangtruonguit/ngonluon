// email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    this.transporter = nodemailer.createTransport(
      isProduction
        ? {
            // Production: SMTP thật (Gmail, SendGrid, AWS SES...)
            host: this.configService.get('MAIL_HOST'),
            port: this.configService.get('MAIL_PORT', 587),
            secure: false,
            auth: {
              user: this.configService.get('MAIL_USER'),
              pass: this.configService.get('MAIL_PASS'),
            },
          }
        : {
            // Development: Mailcatcher (không auth)
            host: this.configService.get('MAIL_HOST', 'localhost'),
            port: this.configService.get<number>('MAIL_PORT', 1025),
            ignoreTLS: true,
          },
    );
  }

  async send(payload: EmailPayload): Promise<void> {
    const html = this.renderTemplate(payload.template, payload.data);

    await this.transporter.sendMail({
      from: this.configService.get(
        'MAIL_FROM',
        '"NgonLuon" <noreply@ngonluon.com>',
      ),
      to: payload.to,
      subject: payload.subject,
      html,
    });

    this.logger.log(`Email sent to ${payload.to}: ${payload.subject}`);
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    try {
      // Try multiple potential locations for templates to handle both dev and prod/build structures
      const possiblePaths = [
        path.join(
          process.cwd(),
          'src',
          'mail',
          'templates',
          `${template}.html`,
        ),
        path.join(
          process.cwd(),
          'dist',
          'mail',
          'templates',
          `${template}.html`,
        ),
        path.join(__dirname, 'templates', `${template}.html`),
        path.join(
          __dirname,
          '..',
          '..',
          'mail',
          'templates',
          `${template}.html`,
        ),
      ];

      let templatePath = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }

      if (!templatePath) {
        this.logger.warn(
          `Template file not found: ${template}. Tried: ${possiblePaths.join(', ')}. Falling back to basic rendering.`,
        );
        return this.renderFallback(template, data);
      }

      let html = fs.readFileSync(templatePath, 'utf8');

      // Simple interpolation: {{key}} -> data[key]
      Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const replacement =
          typeof value === 'string' ? value : JSON.stringify(value);
        html = html.replace(regex, replacement);
      });

      return html;
    } catch (error) {
      this.logger.error(`Error rendering template ${template}:`, error);
      return this.renderFallback(template, data);
    }
  }

  private renderFallback(template: string, data: Record<string, any>): string {
    const templates: Record<string, (d: Record<string, any>) => string> = {
      welcome: (d) => `<h1>Chào mừng ${String(d.fullName)}!</h1>`,
      reset_password: (d) =>
        `<h1>Reset mật khẩu</h1><p>${String(d.resetUrl)}</p>`,
      subscription: (d) =>
        `<h1>Chúc mừng ${String(d.fullName)}!</h1><p>Gói: ${String(d.planName)}</p>`,
    };

    const render = templates[template];
    return render ? render(data) : `<p>${JSON.stringify(data)}</p>`;
  }
}
