import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateDesignationInput } from './create-designation.dto';

@InputType()
export class UpdateDesignationInput extends PartialType(CreateDesignationInput) {
  @Field(() => String)
  id: string;
}