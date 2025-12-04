// src/users/users.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { UsersService } from '../users.service';
import { UserModel } from '../models/user.model';
import { CreateUserInput } from '../dto/create-user.input';
import { LoginUserInput } from '../dto/login-user.input';

import { LoginResponse } from '../dto/login-response.type';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UpdateUserInput } from '../dto/update-user.input';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) { }

  @Query(() => String, { name: 'ping' })
  ping(): string {
    return 'pong';
  }

  @Query(() => [UserModel], { name: 'users' })
  async findAll(): Promise<UserModel[]> {
    return this.usersService.findAll();
  }

  @Mutation(() => UserModel, { name: 'createUser' })
  async create(@Args('input') input: CreateUserInput): Promise<UserModel> {
    return this.usersService.create(input);
  }

  @Mutation(() => LoginResponse, { name: 'login' })
  async login(@Args('input') input: LoginUserInput): Promise<LoginResponse> {
    return this.usersService.login(input);
  }


  @Query(() => UserModel, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: any): Promise<UserModel> {
    const userId = user?.userId || user?.sub || user?.id || user?._id;
    return this.usersService.findById(userId);
  }

  @Mutation(() => UserModel, { name: 'updateUser' })
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: any,
  ): Promise<UserModel> {
    const currentUserId = user?.userId || user?.sub || user?.id || user?._id;
    const targetId = input.id ? input.id : currentUserId;

    const { id, ...updateData } = input as any;

    return this.usersService.update(targetId, updateData);
  }
}
