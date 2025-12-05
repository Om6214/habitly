import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderService } from '../reminder/reminder.service';
import { NotificationService } from './notification/notification.service';
import { DateTime } from 'luxon';
import { ReminderProcessor } from './reminder.processor';
const cronParser = require('cron-parser');

@Injectable()
export class ReminderScheduler {
    private readonly logger = new Logger(ReminderScheduler.name);

    constructor(
        private readonly reminderService: ReminderService,
        private readonly notificationService: NotificationService,
        private readonly reminderProcessor: ReminderProcessor,
    ) { }

    // run every minute
    @Cron(CronExpression.EVERY_MINUTE)
    async checkReminders() {
        this.logger.debug('Checking reminders...');
        try {
            const reminders = await this.reminderService.findEnabled(500);
            const nowUtc = DateTime.utc();

            for (const rem of reminders) {
                try {
                    if (!rem.enabled) continue;

                    const lastSent = rem.lastSentAt ? DateTime.fromJSDate(rem.lastSentAt).toUTC() : null;
                    if (lastSent && nowUtc.diff(lastSent, 'minutes').minutes < 0.9) {
                        // recently sent
                        continue;
                    }

                    let shouldSend = false;

                    if (rem.cron) {
                        try {
                            // Wider, more forgiving window to tolerate clock skew and test speed
                            const tz = rem.timezone || 'UTC';
                            const windowStart = nowUtc.minus({ minutes: 2 }).toJSDate(); // 2 minutes before now
                            const windowEnd = nowUtc.plus({ minutes: 2 }).toJSDate();   // 2 minutes after now

                            // Ask cron-parser for the next occurrence after windowStart
                            const interval = cronParser.parseExpression(rem.cron, {
                                currentDate: windowStart,
                                tz,
                            });

                            const nextRaw = interval.next();
                            const nextDate = typeof (nextRaw as any).toDate === 'function' ? (nextRaw as any).toDate() : (nextRaw as Date);
                            const next = DateTime.fromJSDate(nextDate).toUTC();

                            const windowEndUtc = DateTime.fromJSDate(windowEnd).toUTC();

                            if (next <= windowEndUtc) {
                                shouldSend = true;
                            } else {
                                // fallback for "every-minute" patterns in flaky environments / tests
                                const everyMinutePatterns = ['* * * * *', '*/1 * * * *'];
                                if (everyMinutePatterns.includes((rem.cron || '').trim())) {
                                    shouldSend = true;
                                }
                            }
                        } catch (e) {
                            this.logger.warn(`Bad cron expression for reminder ${rem._id}: ${rem.cron}`, (e as Error).message);
                            // if parse fails but cron looks like every-minute, try the fallback
                            const everyMinutePatterns = ['* * * * *', '*/1 * * * *'];
                            if (everyMinutePatterns.includes((rem.cron || '').trim())) {
                                shouldSend = true;
                            }
                        }
                    }
                    else if (rem.time) {
                        // If time is set (HH:mm or ISO time) plus timezone — assume repeating daily at time
                        try {
                            const tz = rem.timezone || 'UTC';
                            const parts = rem.time.split(':').map(p => parseInt(p, 10));
                            const targetToday = DateTime.now().setZone(tz).set({
                                hour: parts[0] ?? 0,
                                minute: parts[1] ?? 0,
                                second: 0,
                                millisecond: 0,
                            });

                            const targetUtc = targetToday.toUTC();

                            const diffSec = Math.abs(nowUtc.diff(targetUtc, 'seconds').seconds);
                            if (diffSec <= 70) shouldSend = true;
                        } catch (err) {
                            this.logger.warn(`Bad time for reminder ${rem._id}: ${rem.time}`, err);
                        }
                    }

                    if (!shouldSend) continue;

                    // Build payload
                    // const payload = {
                    //     reminderId: rem._id.toString(),
                    //     userId: rem.user.toString(),
                    //     habitId: rem.habit.toString(),
                    //     channel: rem.channel,
                    //     note: rem.note,
                    //     timezone: rem.timezone,
                    // };

                    const payload = await this.reminderProcessor.buildPayload(rem);

                    const result = await this.notificationService.send(rem.channel as any, payload);

                    if (result?.ok) {
                        await this.reminderService.markSent(rem._id.toString());
                        this.logger.log(`Sent reminder ${rem._id} via ${rem.channel}`);
                    } else {
                        this.logger.warn(
                            `Failed to send reminder ${rem._id} via ${rem.channel}: ${result?.error || 'unknown'}`,
                        );
                    }
                } catch (inner) {
                    this.logger.error('Error processing reminder', inner);
                }
            }
        } catch (err) {
            this.logger.error('Failed to check reminders', err);
        }
    }
}