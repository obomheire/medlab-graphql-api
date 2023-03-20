import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Laborataory {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
