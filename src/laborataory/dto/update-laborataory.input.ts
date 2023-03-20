import { CreateLaborataoryInput } from './create-laborataory.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateLaborataoryInput extends PartialType(
  CreateLaborataoryInput,
) {
  @Field(() => Int)
  id: number;
}
