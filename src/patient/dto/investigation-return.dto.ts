import { Field, Int, ObjectType } from '@nestjs/graphql';
import { InvestigationEntity } from '../entities/investigation.entity';

@ObjectType()
export class InvestigationResponse {
  @Field(() => [InvestigationEntity], { nullable: true })
  investigations: InvestigationEntity[];
  @Field(() => Int, { nullable: true })
  count: number;
  @Field(() => Int, { nullable: true })
  currentPage: number;
  @Field(() => Int, { nullable: true })
  totalPages: number;
}
