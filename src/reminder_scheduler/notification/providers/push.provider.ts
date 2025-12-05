import { Injectable, Logger } from '@nestjs/common';
import { SendResultDto } from '../dto/send-result.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);
  constructor(private readonly config: ConfigService) {}

  async send(payload: any): Promise<SendResultDto> {
    // Replace with FCM implementation. For dev we log.
    const target = payload.pushToken || null;
    if (!target) return { ok: false, error: 'No push token' };

    this.logger.log(`(DEV) Push to ${target}: ${payload.note || 'habit reminder'}`);
    return { ok: true, info: { dev: true } };
  }
}
