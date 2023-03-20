import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { isOutputType } from 'graphql';
import { User } from '../entities/user.entity';

@ObjectType()
export class UserResponse {
  @Field(() => [User], { nullable: true })
  users: User[];
  @Field(() => Int, { nullable: true })
  count: number;
  @Field(() => Int, { nullable: true })
  currentPage: number;
  @Field(() => Int, { nullable: true })
  totalPages: number;
}
