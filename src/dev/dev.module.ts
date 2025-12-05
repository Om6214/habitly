// src/dev/dev.module.ts
import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { ReminderScheduler } from '../reminder_scheduler/reminder.scheduler';
import { ReminderModule } from 'src/reminder/reminder.module';

@Module({
    imports: [ReminderModule],
    controllers: [DevController],
})
export class DevModule { }
