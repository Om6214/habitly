// src/reminderscheduler/reminder.processor.ts
import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HabitsService } from '../habit/habit.service';
import { ReminderDocument } from '../reminder/schemas/reminder.schema';

@Injectable()
export class ReminderProcessor {
    private readonly logger = new Logger(ReminderProcessor.name);
    constructor(
        private readonly usersService: UsersService,
        private readonly habitService: HabitsService,
    ) { }

    // prepare payload for notification provider. Fetch user email/phone and habit title.
    async buildPayload(rem: ReminderDocument) {
        const user = await this.usersService.findById(rem.user.toString());
        const habit = await this.habitService.findById(rem.habit.toString());

        const email = user?.email || null;

        const subject = `Habit reminder: ${habit?.title ?? 'Your habit'}`;
        const note = rem.note ?? `Time to ${habit?.title ?? 'do your habit'}`;
        return {
            reminderId: rem._id.toString(),
            userId: rem.user.toString(),
            habitId: rem.habit.toString(),
            habitTitle: habit?.title,
            email,
            subject,
            note,
            text: note,
            html: `<p>${note}</p><p><strong>Habit:</strong> ${habit?.title ?? ''}</p>`,
            channel: rem.channel,
        };
    }
}
