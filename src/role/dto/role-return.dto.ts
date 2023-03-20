import { Field, ObjectType } from "@nestjs/graphql";
import { Designation } from "../entities/designation.entity";
import { Role } from "../entities/role.entity";

@ObjectType()
export class RoleReturnDto {
    @Field(() => [Designation], { description: 'designation field (placeholder)' , nullable: true })
    designations?: Designation[] | null;
    
    @Field(() => Role, { description: 'name field (placeholder)' })
    role: Role;
}