import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class HabitModel {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  frequency: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  createdAt?: Date;
}
