import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Habit, HabitSchema } from './schema/habit.schema';
import { HabitLog, HabitLogSchema } from './schema/habit-log.schema';
import { HabitsService } from './habit.service';
import { HabitsResolver } from './habit.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Habit.name, schema: HabitSchema },
      { name: HabitLog.name, schema: HabitLogSchema },
    ]),
    AuthModule, 
  ],
  providers: [HabitsService, HabitsResolver],
  exports: [HabitsService],
})
export class HabitsModule {}
