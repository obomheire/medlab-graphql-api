import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreatePrescriptionInput } from './create-prescription.dto';

@InputType()
export class UpdatePrescriptionInput extends PartialType(CreatePrescriptionInput) {
  @Field(() => String, { nullable: true})
  id: string;
}
