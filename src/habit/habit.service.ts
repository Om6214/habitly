import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Habit, HabitDocument } from './schema/habit.schema';
import { HabitLog, HabitLogDocument } from './schema/habit-log.schema';
import { CreateHabitInput } from './dto/create-habit.input';
import { UpdateHabitInput } from './dto/update-habit.input';
import { ToggleHabitInput } from './dto/toggle-habit.input';
import { Types } from 'mongoose';



@Injectable()
export class HabitsService {
  constructor(
    @InjectModel(Habit.name) private habitModel: Model<HabitDocument>,
    @InjectModel(HabitLog.name) private habitLogModel: Model<HabitLogDocument>,
  ) { }

  private toObjectId(id: string) {
    try {
      return new Types.ObjectId(id);
    } catch {
      return id;
    }
  }

  async create(userId: string, input: CreateHabitInput) {
    const doc = new this.habitModel({
      user: this.toObjectId(userId),
      title: input.title,
      description: input.description || '',
      frequency: input.frequency || 'DAILY',
    });
    const saved = await doc.save();
    return this.toHabitModel(saved);
  }

  async update(userId: string, input: UpdateHabitInput) {
    const objUser = this.toObjectId(userId);
    const habit = await this.habitModel.findOne({ _id: input.id, user: objUser }).exec();
    if (!habit) throw new NotFoundException('Habit not found');
    Object.assign(habit, {
      title: input.title ?? habit.title,
      description: input.description ?? habit.description,
      frequency: input.frequency ?? habit.frequency,
      isActive: input.isActive ?? habit.isActive,
    });
    const saved = await habit.save();
    return this.toHabitModel(saved);
  }

  async delete(userId: string, id: string) {
    const objUser = this.toObjectId(userId);
    const res = await this.habitModel.findOneAndDelete({ _id: id, user: objUser }).exec();
    if (!res) throw new NotFoundException('Habit not found');
    await this.habitLogModel.deleteMany({ habit: id }).exec();
    return true;
  }

  async list(userId: string) {
    const objUser = this.toObjectId(userId);
    const docs = await this.habitModel.find({ user: objUser, isActive: true }).exec();
    return docs.map(d => this.toHabitModel(d));
  }

  async toggleCompletion(userId: string, input: ToggleHabitInput) {
    const { habitId } = input;
    const date = input.date ? this.normalizeDate(input.date) : this.normalizeDate();
    const objUser = this.toObjectId(userId);
    const habit = await this.habitModel.findOne({ _id: habitId, user: objUser }).exec();
    if (!habit) throw new NotFoundException('Habit not found');

    const existing = await this.habitLogModel.findOne({ habit: habitId, date }).exec();
    if (existing) {
      existing.isCompleted = !existing.isCompleted;
      await existing.save();
      return this.toHabitLogModel(existing);
    } else {
      const doc = new this.habitLogModel({ habit: habitId, date, isCompleted: true });
      const saved = await doc.save();
      return this.toHabitLogModel(saved);
    }
  }

  async getLogs(habitId: string, days = 7) {
    const logs = await this.habitLogModel
      .find({ habit: habitId })
      .sort({ date: -1 })
      .limit(days)
      .exec();
    return logs.map(l => this.toHabitLogModel(l));
  }

  async analytics(userId: string, habitId: string, days = 7) {
    const objUser = this.toObjectId(userId);
    const habit = await this.habitModel.findOne({ _id: habitId, user: objUser }).exec();
    if (!habit) throw new NotFoundException('Habit not found');

    const logs = await this.habitLogModel.find({ habit: habitId })
      .sort({ date: -1 })
      .limit(days)
      .exec();

    const completed = logs.filter(l => l.isCompleted).length;
    const completionRate = logs.length ? (completed / logs.length) * 100 : 0;

    let streak = 0;
    for (const l of logs) {
      if (l.isCompleted) streak++;
      else break;
    }

    return { streak, completionRate, lastLogs: logs.map(l => this.toHabitLogModel(l)) };
  }

  // helpers
  private normalizeDate(dateStr?: string) {
    const d = dateStr ? new Date(dateStr) : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private toHabitModel(doc: any) {
    const o = doc.toObject();
    return {
      id: o._id?.toString(),
      title: o.title,
      description: o.description,
      frequency: o.frequency,
      isActive: o.isActive,
      createdAt: o.createdAt,
    };
  }

  private toHabitLogModel(doc: any) {
    const o = doc.toObject();
    return {
      id: o._id?.toString(),
      date: o.date,
      isCompleted: o.isCompleted,
    };
  }
}
