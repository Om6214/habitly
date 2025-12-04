// src/habits/habits.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { HabitsService } from './habit.service';
import { HabitModel } from './model/habit.model';
import { HabitLogModel } from './model/habit-log.model';
import { CreateHabitInput } from './dto/create-habit.input';
import { UpdateHabitInput } from './dto/update-habit.input';
import { ToggleHabitInput } from './dto/toggle-habit.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

function extractUserId(user: any): string | null {
  if (!user) return null;
  if (typeof user === 'string') return user;
  // common shapes: { userId }, { sub }, { id }, { _id }
  return user.userId || user.sub || user.id || user._id?.toString() || null;
}

@Resolver(() => HabitModel)
export class HabitsResolver {
  constructor(private readonly habitsService: HabitsService) { }

  @Query(() => [HabitModel])
  @UseGuards(GqlAuthGuard)
  async myHabits(@CurrentUser() user: any) {
    const userId = extractUserId(user);
    if (!userId) throw new Error('Unauthenticated: could not determine user id');
    // optional debug:
    // console.log('myHabits called for userId=', userId);
    return this.habitsService.list(userId);
  }

  @Mutation(() => HabitModel)
  @UseGuards(GqlAuthGuard)
  async createHabit(
    @CurrentUser() user: any,
    @Args('input') input: CreateHabitInput,
  ) {
    const userId = user?.userId || user?.sub;
    return this.habitsService.create(userId, input);
  }

  @Mutation(() => HabitModel)
  @UseGuards(GqlAuthGuard)
  async updateHabit(
    @CurrentUser() user: any,
    @Args('input') input: UpdateHabitInput,
  ) {
    const userId = user?.userId || user?.sub;
    return this.habitsService.update(userId, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteHabit(
    @CurrentUser() user: any,
    @Args('id') id: string,
  ) {
    const userId = user?.userId || user?.sub;
    return this.habitsService.delete(userId, id);
  }

  @Mutation(() => HabitLogModel)
  @UseGuards(GqlAuthGuard)
  async toggleHabitCompletion(
    @CurrentUser() user: any,
    @Args('input') input: ToggleHabitInput,
  ) {
    const userId = user?.userId || user?.sub;
    return this.habitsService.toggleCompletion(userId, input);
  }

  // Note: we explicitly declare the GraphQL types for args
  @Query(() => [HabitLogModel])
  @UseGuards(GqlAuthGuard)
  async habitLogs(
    @Args('habitId') habitId: string,
    @Args('days', { type: () => Int, nullable: true }) days = 7,
  ) {
    return this.habitsService.getLogs(habitId, days);
  }

  // Provide a proper return type for analytics (object), here we keep it simple:
  // you can replace `Object` with a dedicated @ObjectType() later if you want.
  @Query(() => String)
  @UseGuards(GqlAuthGuard)
  async habitAnalytics(
    @CurrentUser() user: any,
    @Args('habitId') habitId: string,
    @Args('days', { type: () => Int, nullable: true }) days = 7,
  ) {
    const userId = user?.userId || user?.sub;
    const res = await this.habitsService.analytics(userId, habitId, days);
    // return JSON string for now (keeps schema simple); change to an ObjectType later
    return JSON.stringify(res);
  }
}
