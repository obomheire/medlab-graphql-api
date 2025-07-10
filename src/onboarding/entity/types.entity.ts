import { Field, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';

@ObjectType()
export class Options {
  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  title: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  route: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  key: string;
}

@ObjectType()
export class UserQuestionDetails {
  @Field(() => String)
  @Prop({ type: String })
  question: string;

  @Field(() => Number, { defaultValue: 1 })
  @Prop({ type: Number, default: 1 })
  progress: number;

  @Field(() => [Options], { nullable: true })
  @Prop({ type: [Options] })
  options: Options[];

  @Field(() => String)
  @Prop({ type: String })
  userResponse: string;
}
