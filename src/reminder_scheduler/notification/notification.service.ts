import { Injectable, Logger } from '@nestjs/common';
// import { SmsProvider } from './providers/sms.provider';
// import { PushProvider } from './providers/push.provider';
import { SendResultDto } from './dto/send-result.dto';
import { EmailProvider } from './providers/email.provider';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        private readonly emailProvider: EmailProvider,
        // private readonly smsProvider: SmsProvider,
        // private readonly pushProvider: PushProvider,
    ) { }

    // channel: 'EMAIL' | 'SMS' | 'PUSH'
    async send(channel: string, payload: any): Promise<SendResultDto> {
        try {
            switch (channel) {
                case 'EMAIL':
                    return await this.emailProvider.send(payload);
                // case 'SMS':
                //   return await this.smsProvider.send(payload);
                // case 'PUSH':
                //   return await this.pushProvider.send(payload);
                default:
                    return { ok: false, error: `Unknown channel ${channel}` };
            }
        } catch (err) {
            this.logger.error('Notification send error', err);
            return { ok: false, error: (err as Error).message || 'send error' };
        }
    }
}
