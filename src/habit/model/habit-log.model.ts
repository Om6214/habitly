import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class HabitLogModel {
  @Field(() => ID)
  id: string;

  @Field()
  date: string;

  @Field()
  isCompleted: boolean;
}
