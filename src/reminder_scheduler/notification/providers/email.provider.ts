// src/reminder_scheduler/notification/providers/email.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendResultDto } from '../dto/send-result.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailProvider {
    private readonly logger = new Logger(EmailProvider.name);
    private transporter: nodemailer.Transporter;

    constructor(private readonly config: ConfigService) {
        const host = this.config.get<string>('SMTP_HOST') || 'localhost';
        const port = parseInt(this.config.get<string>('SMTP_PORT') || '587', 10);
        const user = this.config.get<string>('SMTP_USER') || '';
        const pass = this.config.get<string>('SMTP_PASS') || '';

        // create transporter for Gmail (or any SMTP)
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for other ports (587 uses STARTTLS)
            auth: user && pass ? { user, pass } : undefined,
            tls: {
                rejectUnauthorized: false,
            },
        });
    }

    async send(payload: any): Promise<SendResultDto> {
        // Construct recipient: prefer explicit payload.email then fallback to DEV_FALLBACK_EMAIL
        const to = payload.email || this.config.get<string>('DEV_FALLBACK_EMAIL');
        const subject = payload.subject || `Reminder: ${payload.habitTitle || 'Your habit'}`;
        const text = payload.text || payload.note || `It's time for your habit: ${payload.habitTitle || payload.habitId}`;
        const html = payload.html || `<p>${text}</p>`;

        if (!to) {
            this.logger.warn('No recipient for email provider');
            return { ok: false, error: 'No recipient email' };
        }

        try {
            this.logger.log(`Attempting to send email to ${to} (subject: ${subject})`);
            const info = await this.transporter.sendMail({
                from: this.config.get<string>('MAIL_FROM') || this.config.get<string>('SMTP_USER'),
                to,
                subject,
                text,
                html,
            });

            this.logger.log(`Email send result: messageId=${info?.messageId}`);
            return { ok: true, info };
        } catch (err) {
            this.logger.error('Email send failed', err);
            return { ok: false, error: (err as Error).message || String(err) };
        }
    }
}
