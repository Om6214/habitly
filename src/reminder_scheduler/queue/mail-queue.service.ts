import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);
  constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {}

  async enqueueEmail(reminderId: string, scheduledKey: string, payload: any) {
    const jobId = `reminder:${reminderId}:${scheduledKey}`;

    const opts = {
      jobId,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000, // initial 1s, grows
      },
      removeOnComplete: { age: 60 * 60 }, // keep completed jobs 1 hour
      removeOnFail: { age: 60 * 60 * 24 }, 
    };

    try {
      const job = await this.mailQueue.add('send_email', payload, opts);
      this.logger.log(`Enqueued mail job ${job.id} (jobId=${jobId})`);
      return { ok: true, jobId };
    } catch (err) {
      this.logger.error('Failed enqueue mail job', err);
      return { ok: false, error: (err as Error).message || String(err) };
    }
  }
}
