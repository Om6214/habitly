import { Module } from '@nestjs/common';
import { ReminderResolver } from './reminder.resolver';
import { ReminderService } from './reminder.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Reminder, ReminderSchema } from './schemas/reminder.schema';
import { Habit, HabitSchema } from 'src/habit/schema/habit.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reminder.name, schema: ReminderSchema },
      { name: Habit.name, schema: HabitSchema },
      { name: User.name, schema: UserSchema },
    ])
  ],
  providers: [ReminderResolver, ReminderService],
  exports: [ReminderService],
})
export class ReminderModule { }
