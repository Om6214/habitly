import { Field, ObjectType } from "@nestjs/graphql";
import { UserModel } from "../models/user.model";

@ObjectType()
export class LoginResponse {
    @Field()
    accessToken: string;

    @Field({ nullable: true })
    resfreshToken?: string;

    @Field(() => UserModel)
    user: UserModel;

}