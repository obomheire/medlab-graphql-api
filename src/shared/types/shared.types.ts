/* eslint-disable prettier/prettier */
import { ObjectType, Field } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class Shared {
  @Field(() => String, { nullable: true })
  username: string;

  @Field(() => String, { nullable: true })
  firstName: string;

  @Field(() => String, { nullable: true })
  lastName: string;
}

@ObjectType()
export class SharedRes {
  @Field(() => String)
  sharedUUID: string;

  @Field(() => String)
  sharedContent: string;

  @Field(() => Shared, { nullable: true })
  sharedBy: Shared;

  @Field(() => Shared, { nullable: true })
  sharedWith: Shared;

  @Field(() => GraphQLJSONObject, { nullable: true })
  content: { [key: string]: string };
}
