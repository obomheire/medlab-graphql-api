import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Role } from "../entities/role.entity";

@InputType()
export class CreateDesignationInput {
    @IsString()
    @IsNotEmpty()
    @Field(() => String, { description: 'name field (placeholder)' })
    name: string;

    @IsString()
    @IsOptional()
    @Field(() => String, { description: 'description field (placeholder)', nullable: true })
    description?: string;

    @IsString()
    @IsNotEmpty()
    @Field(() => String, { description: 'role field (placeholder)' })
    role: Role
}