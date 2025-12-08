import { Module, forwardRef, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { MailQueueService } from './mail-queue.service';
import { MailProcessor } from './mail.processor';
import { NotificationModule } from '../notification/notification.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReminderModule } from 'src/reminder/reminder.module';
import type { Queue } from 'bull';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueueAsync({
      name: 'mail',
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        redis: {
          host: cfg.get('REDIS_HOST') || '127.0.0.1',
          port: parseInt(cfg.get('REDIS_PORT') || '6379', 10),
        },
      }),
      inject: [ConfigService],
    }),
    NotificationModule,
    forwardRef(() => ReminderModule),
  ],
  providers: [MailQueueService, MailProcessor],
  exports: [MailQueueService],
})
export class MailQueueModule implements OnModuleInit {
  private readonly logger = new Logger('MailQueueModule');

  constructor(@Inject(getQueueToken('mail')) private readonly mailQueue: Queue) {}

  onModuleInit() {
    this.logger.log('Mail queue initialized.');

    this.mailQueue.on('waiting', (jobId) => {
      this.logger.log(`Job waiting: ${jobId}`);
    });

    this.mailQueue.on('active', (job) => {
      this.logger.log(`Job started: ${job.id}`);
    });

    this.mailQueue.on('completed', (job) => {
      this.logger.log(`Job completed: ${job.id}`);
    });

    this.mailQueue.on('failed', (job, err) => {
      this.logger.error(`Job failed: ${job.id} - ${err.message}`);
    });

    this.mailQueue.on('error', (err) => {
      this.logger.error(`Queue error: ${err.message}`);
    });

    this.mailQueue.on('stalled', (job) => {
      this.logger.warn(`Job stalled: ${job.id}`);
    });

    this.mailQueue.on('cleaned', (jobs, type) => {
      this.logger.log(`Cleaned ${jobs.length} jobs (type=${type})`);
    });

    this.mailQueue.on('drained', () => {
      this.logger.log(`Queue drained (no more jobs left).`);
    });
  }
}
