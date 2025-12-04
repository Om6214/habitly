import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReminderService } from './reminder.service';
import { ReminderModel } from './model/reminder.model';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateReminderInput } from './dto/create-reminder.input';
import { UpdateReminderInput } from './dto/update-reminder.input';

@Resolver(() => ReminderModel)
export class ReminderResolver {
    constructor(
        private readonly reminderService: ReminderService,
    ) { }

    @Query(() => [ReminderModel], { name: 'remindersForUser' })
    @UseGuards(GqlAuthGuard)
    async myReminders(@CurrentUser() user: any) {
        try {
            const userId = user?.userId || user?.sub || user?.id;
            return this.reminderService.listForUser(userId);
        } catch (error) {
            throw error;
        }
    }

    @Mutation(() => ReminderModel, { name: 'createReminder' })
    @UseGuards(GqlAuthGuard)
    async createReminder(
        @CurrentUser() user: any,
        @Args('input') input: CreateReminderInput,
    ) {
        const userId = user?.userId || user?.sub || user?.id;
        const res = await this.reminderService.createReminder(userId, input);

        return {
            id: res.id.toString(),
            user: res.user.toString(),
            habit: res.habit.toString(),
            channel: res.channel,
            cron: res.cron,
            time: res.time,
            timezone: res.timezone,
            enabled: res.enabled,
            note: res.note,
            lastSentAt: res.lastSentAt,
            createdAt: res.createdAt,
            updatedAt: res.updatedAt,
        }
    }

    @Mutation(() => ReminderModel)
    @UseGuards(GqlAuthGuard)
    async updateReminder(@CurrentUser() user: any, @Args('input') input: UpdateReminderInput) {
        const userId = user?.userId || user?.sub || user?.id;
        return this.reminderService.update(userId, input);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    async deleteReminder(@CurrentUser() user: any, @Args('id') id: string) {
        const userId = user?.userId || user?.sub || user?.id;
        return this.reminderService.delete(userId, id);
    }

}
