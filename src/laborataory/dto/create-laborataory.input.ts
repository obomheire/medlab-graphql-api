import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateLaborataoryInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
