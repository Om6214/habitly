import { Controller, Get } from '@nestjs/common';
import { ReminderScheduler } from '../reminder_scheduler/reminder.scheduler';

@Controller('dev')
export class DevController {
  constructor(private readonly scheduler: ReminderScheduler) {}

  @Get('run-reminders')
  async run() {
    await this.scheduler.checkReminders();
    return { ok: true };
  }
}
