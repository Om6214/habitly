import { InputType, Field, PartialType } from "@nestjs/graphql";
import { CreateReminderInput } from "./create-reminder.input";
import { IsNotEmpty } from "class-validator";

@InputType()
export class UpdateReminderInput extends PartialType(CreateReminderInput) {
    @Field()
    @IsNotEmpty()
    id: string;
}