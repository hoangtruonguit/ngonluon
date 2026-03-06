import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor() {
        // For development, we can use a dummy logger or a real SMTP if provided
        // Using Ethereal or similar for testing? Or just log for now if no SMTP provided.
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

        // In a real app, you'd use a template engine
        const mailOptions = {
            from: '"StreamFlow" <no-reply@streamflow.com>',
            to: email,
            subject: 'Welcome to StreamFlow!',
            text: `Hi ${fullName},\n\nWelcome to StreamFlow! We are glad to have you with us.\n\nBest regards,\nThe StreamFlow Team`,
            html: `<h1>Welcome to StreamFlow!</h1><p>Hi ${fullName},</p><p>We are glad to have you with us.</p><p>Best regards,<br>The StreamFlow Team</p>`,
        };

        try {
            if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MAIL === 'true') {
                const info = await this.transporter.sendMail(mailOptions);
                this.logger.log(`Email sent: ${info.messageId}`);
            } else {
                this.logger.log(`[DEVELOPMENT] Email would be sent to ${email} with content: ${mailOptions.text}`);
            }
        } catch (error) {
            this.logger.error(`Failed to send email to ${email}`, error);
        }
    }
}
