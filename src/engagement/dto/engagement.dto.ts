import { Field, InputType } from "@nestjs/graphql";


@InputType()
export class AIEngagementDto {
  @Field(() => String)
  childMessage: string;

  @Field(() => String)
  parentMessage: string;
  
}

