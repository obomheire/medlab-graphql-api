import { Field, Float, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
@ObjectType()
export class ClinExamProduct {
  @Field(() => String, { nullable: true })
  @Prop()
  monthely: string;

  @Field(() => String, { nullable: true })
  @Prop()
  fourmonths: string;

  @Field(() => String, { nullable: true })
  @Prop()
  fourMonthsPriceId: string;
}
