import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateHabitInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ defaultValue: 'DAILY' })
  frequency?: 'DAILY' | 'WEEKLY';
}
