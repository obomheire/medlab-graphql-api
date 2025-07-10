import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AppRes {
  @Field(() => String)
  message: string;

  @Field(() => String)
  status: string;
}
