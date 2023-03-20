import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, Min, MinLength } from "class-validator";

@InputType()
export class FirstLoginInput {
    @IsEmail()
    @IsNotEmpty()
    @Field(() => String, { description: 'email field (placeholder)' })
    email: string;

    @IsNotEmpty()
    @Field(() => String, { description: 'password field (placeholder)' })
    password: string;

    @IsNotEmpty()
    @MinLength(8)
    @Field(() => String, { description: 'confirmPassword field (placeholder)' })
    newPassword: string;

    @IsNotEmpty()
    @MinLength(8)
    @Field(() => String, { description: 'confirmPassword field (placeholder)' })
    confirmPassword: string;
}