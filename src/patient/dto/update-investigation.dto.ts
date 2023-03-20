import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateInvestigationInput } from './create-investigation.dto';

@InputType()
export class UpdateInvestigationInput extends PartialType(CreateInvestigationInput) {
  @Field(() => String, { nullable: true})
  id: string;
}
