import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateHabitInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  frequency?: 'DAILY' | 'WEEKLY';

  @Field({ nullable: true })
  isActive?: boolean;
}
