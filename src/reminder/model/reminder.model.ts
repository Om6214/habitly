import { ObjectType, Field, ID } from "@nestjs/graphql";
import { ReminderChannel } from "../schemas/reminder.schema";

@ObjectType()
export class ReminderModel {
    @Field(() => ID)
    id: string;

    @Field(() => ID)
    user: string;

    @Field(() => ID)
    habit: string;

    @Field(() => ReminderChannel)
    channel: ReminderChannel;

    @Field({ nullable: true })
    cron?: string;

    @Field({ nullable: true })
    time?: string;

    @Field({ nullable: true })
    timezone?: string;

    @Field()
    enabled: boolean;

    @Field({ nullable: true })
    note?: string;

    @Field({ nullable: true })
    lastSentAt?: Date;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
