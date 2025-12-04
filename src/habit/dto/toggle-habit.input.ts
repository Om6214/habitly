import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class ToggleHabitInput {
  @Field()
  habitId: string;
  
  @Field({ nullable: true })
  date?: string;
}
