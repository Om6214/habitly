import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { registerEnumType } from "@nestjs/graphql";

export type ReminderDocument = Reminder & Document;

export enum ReminderChannel {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    PUSH = 'PUSH',
}

registerEnumType(ReminderChannel, {
    name: 'ReminderChannel',
    description: 'The channel through which the reminder will be sent',
})

@Schema({ timestamps: true })
export class Reminder {
    
    
    @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true, ref: 'Habit' })
    habit: Types.ObjectId;

    @Prop({ type: String, enum: Object.values(ReminderChannel), required: true })
    channel: ReminderChannel;

    @Prop()
    cron?: string;

    @Prop()
    time?: string;

    @Prop({ trim: true })
    timezone?: string;

    @Prop({ default: true })
    enabled: boolean;

    @Prop({ default: null })
    note?: string;

    @Prop({ default: null })
    lastSentAt?: Date;

}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);

ReminderSchema.index({ habit: 1 });
ReminderSchema.index({ enabled: 1, lastSentAt: 1 });