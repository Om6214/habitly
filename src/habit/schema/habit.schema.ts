import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type HabitDocument = HydratedDocument<Habit>;

@Schema({ timestamps: true })
export class Habit {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ default: '', trim: true })
    description: string;

    @Prop({
        type: String,
        enum: ['DAILY', 'WEEKLY'],  
        default: 'DAILY',
    })
    frequency: 'DAILY' | 'WEEKLY';

    @Prop({ default: true })
    isActive: boolean;
}

export const HabitSchema = SchemaFactory.createForClass(Habit);

