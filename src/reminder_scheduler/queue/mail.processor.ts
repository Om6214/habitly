import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { ReminderService } from 'src/reminder/reminder.service';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);
  constructor(
    private readonly notificationService: NotificationService,
    private readonly reminderService: ReminderService,
  ) {}

  @Process('send_email')
  async handleSendEmail(job: Job) {
    this.logger.log(`Processing job ${job.id} jobId=${job.opts.jobId}`);
    const payload = job.data;

    try {
      const res = await this.notificationService.send('EMAIL', payload);
      if (!res?.ok) {
        throw new Error(res?.error || 'send failed');
      }

      // mark reminder as sent
      if (payload?.reminderId) {
        await this.reminderService.markSent(payload.reminderId);
      }

      this.logger.log(`Email sent for reminder ${payload.reminderId}`);
      return { ok: true };
    } catch (err) {
      this.logger.error(`Job ${job.id} failed`, err);
      throw err; // let Bull handle retries/backoff
    }
  }
}
