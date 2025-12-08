import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Reminder, ReminderDocument } from './schemas/reminder.schema';
import { Model, Types } from 'mongoose';
import { Habit, HabitDocument } from '../habit/schema/habit.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateReminderInput } from './dto/create-reminder.input';
import { UpdateReminderInput } from './dto/update-reminder.input';

type ReminderDTO = {
    id: string;
    user: string;
    habit: string;
    channel: string;
    cron?: string | null;
    time?: string | null;
    timezone?: string | null;
    enabled: boolean;
    note?: string | null;
    lastSentAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

@Injectable()
export class ReminderService {
    constructor(
        @InjectModel(Reminder.name) private reminderModel: Model<ReminderDocument>,
        @InjectModel(Habit.name) private habitModel: Model<HabitDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    private toObjectId(id: string) {
        try {
            return new Types.ObjectId(id);
        } catch {
            return id;
        }
    }

    private toDTO(doc: ReminderDocument): ReminderDTO {
        const o = doc.toObject({ virtuals: false });
        return {
            id: o._id.toString(),
            user: o.user.toString(),
            habit: o.habit.toString(),
            channel: o.channel,
            cron: o.cron ?? null,
            time: o.time ?? null,
            timezone: o.timezone ?? null,
            enabled: Boolean(o.enabled),
            note: o.note ?? null,
            lastSentAt: o.lastSentAt ?? null,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        };
    }


    async createReminder(userId: string, input: CreateReminderInput): Promise<ReminderDTO> {
        // verify user exists
        const user = await this.userModel.findById(this.toObjectId(userId)).exec();
        if (!user) throw new NotFoundException('User not found');

        // verify habit exists and belongs to user
        const habit = await this.habitModel.findById(this.toObjectId(input.habitId)).exec();
        if (!habit || habit.user.toString() !== userId) {
            throw new NotFoundException('Habit not found or not owned by user');
        }

        const reminder = new this.reminderModel({
            user: user._id,
            habit: habit._id,
            channel: input.channel,
            cron: input.cron ?? null,
            time: input.time ?? null,
            timezone: input.timezone ?? null,
            enabled: input.enabled ?? true,
            note: input.note ?? null,
            lastSentAt: null,
        });

        const saved = await reminder.save();
        return this.toDTO(saved);
    }


    async listForUser(userId: string): Promise<ReminderDTO[]> {
        const habits = await this.habitModel
            .find({ user: this.toObjectId(userId) })
            .select('_id')
            .lean()
            .exec();

        const habitIds = habits.map((h: any) => h._id);
        const reminders = await this.reminderModel.find({ habit: { $in: habitIds } }).exec();

        // use the mapper so GraphQL gets `id` and other typed fields
        return reminders.map(r => this.toDTO(r));
    }


    async update(userId: string, input: UpdateReminderInput): Promise<ReminderDTO> {
        const rem = await this.reminderModel.findById(input.id).exec();
        if (!rem) throw new NotFoundException('Reminder not found');

        const habit = await this.habitModel.findOne({ _id: rem.habit, user: this.toObjectId(userId) }).exec();
        if (!habit) throw new ForbiddenException('Not allowed');

        rem.channel = input.channel ?? rem.channel;
        rem.cron = input.cron ?? rem.cron;
        rem.time = input.time ?? rem.time;
        rem.timezone = input.timezone ?? rem.timezone;
        rem.enabled = input.enabled ?? rem.enabled;
        rem.note = input.note ?? rem.note;

        const saved = await rem.save();
        return this.toDTO(saved);
    }


    async delete(userId: string, id: string): Promise<boolean> {
        const rem = await this.reminderModel.findById(id).exec();
        if (!rem) throw new NotFoundException('Reminder not found');

        const habit = await this.habitModel.findOne({ _id: rem.habit, user: this.toObjectId(userId) }).exec();
        if (!habit) throw new ForbiddenException('Not allowed');

        await rem.deleteOne();
        return true;
    }


    async findEnabled(limit = 200): Promise<ReminderDocument[]> {
        return this.reminderModel.find({ enabled: true }).limit(limit).exec();
    }


    async markSent(reminderId: string): Promise<ReminderDTO | null> {
        const updated = await this.reminderModel
            .findByIdAndUpdate(reminderId, { lastSentAt: new Date() }, { new: true })
            .exec();
        return updated ? this.toDTO(updated) : null;
    }
}
