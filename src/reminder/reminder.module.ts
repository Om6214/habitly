import { Module, forwardRef } from '@nestjs/common';
import { ReminderResolver } from './reminder.resolver';
import { ReminderService } from './reminder.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Reminder, ReminderSchema } from './schemas/reminder.schema';
import { Habit, HabitSchema } from 'src/habit/schema/habit.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { NotificationModule } from 'src/reminder_scheduler/notification/notification.module';
import { HabitsModule } from 'src/habit/habit.module';
import { ReminderScheduler } from 'src/reminder_scheduler/reminder.scheduler';
import { UsersModule } from 'src/users/users.module';
import { ReminderProcessor } from 'src/reminder_scheduler/reminder.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reminder.name, schema: ReminderSchema },
      { name: Habit.name, schema: HabitSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationModule),
    HabitsModule,
    UsersModule
  ],
  providers: [ReminderResolver, ReminderService, ReminderScheduler, ReminderProcessor],
  exports: [ReminderService, ReminderScheduler, ReminderProcessor],
})
export class ReminderModule { }
