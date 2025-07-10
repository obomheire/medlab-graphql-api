import { InputType, Field, PartialType, Float } from '@nestjs/graphql';

@InputType()
export class PractCaseInp {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => String, { nullable: true })
  logo: string;
}

@InputType()
export class UpdatePractCaseInput extends PartialType(PractCaseInp) {
  @Field(() => String)
  practCaseUUID: string;
}
