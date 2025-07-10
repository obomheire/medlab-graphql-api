import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';

@ObjectType()
export class Thread {
  @Field(() => String)
  @Prop()
  threadId: string;

  @Field(() => String)
  @Prop()
  description: string;
}

@ObjectType()
export class Vdata {
  @Field(() => Float)
  @Prop()
  incorrect: number;

  @Field(() => Float)
  @Prop()
  correct: number;

  @Field(() => Float)
  @Prop()
  mixed: number;
}
