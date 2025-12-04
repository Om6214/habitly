import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HabitLogDocument = HydratedDocument<HabitLog>;

@Schema({ timestamps: true })
export class HabitLog {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Habit' })
  habit: Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ default: true })
  isCompleted: boolean;
}

export const HabitLogSchema = SchemaFactory.createForClass(HabitLog);
