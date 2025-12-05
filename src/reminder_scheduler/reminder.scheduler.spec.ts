import { Test, TestingModule } from '@nestjs/testing';
import { ReminderScheduler } from './reminder.scheduler';
import { ReminderService } from '../reminder/reminder.service';
import { NotificationService } from './notification/notification.service';
import { DateTime } from 'luxon';

describe('ReminderScheduler', () => {
    let scheduler: ReminderScheduler;
    let reminderService: Partial<Record<keyof ReminderService, jest.Mock>>;
    let notificationService: Partial<Record<keyof NotificationService, jest.Mock>>;

    beforeEach(async () => {
        // mock implementations
        reminderService = {
            findEnabled: jest.fn(),
            markSent: jest.fn(),
        } as any;

        notificationService = {
            send: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReminderScheduler,
                { provide: ReminderService, useValue: reminderService },
                { provide: NotificationService, useValue: notificationService },
            ],
        }).compile();

        scheduler = module.get(ReminderScheduler);
    });

    it('sends notification for cron reminder when due', async () => {
        // prepare a fake reminder that should be sent: use cron "* * * * *" or time close to now
        const now = DateTime.utc();
        const reminderDoc: any = {
            _id: 'rem-1',
            enabled: true,
            cron: '* * * * *', // every minute -> our implementation should pick it up
            time: null,
            timezone: 'UTC',
            lastSentAt: null,
            user: 'user-1',
            habit: 'habit-1',
            channel: 'EMAIL',
            note: 'Test cron every minute',
        };

        (reminderService.findEnabled as jest.Mock).mockResolvedValue([reminderDoc]);
        (notificationService.send as jest.Mock).mockResolvedValue({ ok: true });

        await scheduler.checkReminders();

        expect(notificationService.send).toHaveBeenCalled();
        expect(reminderService.markSent).toHaveBeenCalledWith('rem-1');
    });

    it('sends notification for time-based reminder when within window', async () => {
        // set time to current minute in some timezone
        const tz = 'UTC';
        const nowTz = DateTime.now().setZone(tz);
        const hh = String(nowTz.hour).padStart(2, '0');
        const mm = String(nowTz.minute).padStart(2, '0');

        const reminderDoc: any = {
            _id: 'rem-2',
            enabled: true,
            cron: null,
            time: `${hh}:${mm}`,
            timezone: tz,
            lastSentAt: null,
            user: 'user-2',
            habit: 'habit-2',
            channel: 'EMAIL',
            note: 'Time based test',
        };

        (reminderService.findEnabled as jest.Mock).mockResolvedValue([reminderDoc]);
        (notificationService.send as jest.Mock).mockResolvedValue({ ok: true });

        await scheduler.checkReminders();

        expect(notificationService.send).toHaveBeenCalled();
        expect(reminderService.markSent).toHaveBeenCalledWith('rem-2');
    });
});
