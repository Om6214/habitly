import { Injectable, Logger } from '@nestjs/common';
import { SendResultDto } from '../dto/send-result.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  constructor(private readonly config: ConfigService) {}

  async send(payload: any): Promise<SendResultDto> {
    // Replace with Twilio / Nexmo integration. For now we log and return ok in dev.
    const to = payload.phone || this.config.get<string>('DEV_FALLBACK_PHONE');
    if (!to) return { ok: false, error: 'No phone number' };

    // TODO: integrate Twilio here
    this.logger.log(`(DEV) SMS to ${to}: ${payload.note || 'habit reminder'}`);
    return { ok: true, info: { dev: true } };
  }
}
