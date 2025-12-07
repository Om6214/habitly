export class SendResultDto {
  ok: boolean;
  info?: any;
  error?: string;
  details?: string;
  payloadReceived?: any;
  messageId?: string;
  code?: number;
}
