import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
// import { PushProvider } from './providers/push.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [NotificationService, EmailProvider, SmsProvider,
    // PushProvider
  ],
  exports: [NotificationService],
})
export class NotificationModule { }