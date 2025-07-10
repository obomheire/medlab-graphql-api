import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';

@ObjectType()
export class Question {
  @Field(() => String, { nullable: true })
  @Prop()
  question: string;

  @Field(() => [String], { nullable: true })
  @Prop()
  options: string[];

  @Field(() => String, { nullable: true })
  @Prop()
  answer: string;

  @Field(() => String, { nullable: true })
  @Prop()
  answer_details: string;

  @Field(() => String, { nullable: true })
  @Prop()
  reference: string;

  @Field(() => String, { nullable: true })
  @Prop()
  topic?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  subtopic: string;
}

@ObjectType()
export class Drive {
  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  threadId: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  fileUrl: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  description: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  transcript: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  userPrompt: string;

  @Field(() => [String], { nullable: true })
  @Prop({ default: [] })
  questions?: string[];
}
