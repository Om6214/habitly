import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReminderChannel } from '../schemas/reminder.schema';

@InputType()
export class CreateReminderInput {
    @Field()
    @IsNotEmpty()
    habitId: string;

    @Field()
    @IsEnum(ReminderChannel)
    channel: ReminderChannel;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    cron?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    time?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    timezone?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    note?: string;

    @Field({ nullable: true })
    @IsOptional()
    enabled?: boolean;
}

