import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import GraphQLJSON from 'graphql-type-json';
import { Question } from 'src/drive/entity/types.entity';
import { EngageType, PresQuizType } from 'src/quiz/enum/quiz.enum';

@ObjectType()
export class AddInfoValue {
  @Field(() => String, { nullable: true })
  @Prop()
  text: string;

  @Field(() => String, { nullable: true })
  @Prop()
  image: string;
}

@ObjectType()
export class AddInfo {
  @Field(() => String, { nullable: true })
  @Prop()
  type: string;

  @Field(() => AddInfoValue, { nullable: true })
  @Prop()
  value: AddInfoValue;
}

@ObjectType()
export class Ref {
  @Field(() => String, { nullable: true })
  @Prop()
  type: string;

  @Field(() => String, { nullable: true })
  @Prop()
  value: string;

  @Field(() => String, { nullable: true })
  @Prop()
  caption: string;
}

@ObjectType()
export class ProfileImg {
  @Field(() => String, { nullable: true })
  @Prop()
  name: string;

  @Field(() => String, { nullable: true })
  @Prop()
  role: string;

  @Field(() => String, { nullable: true })
  @Prop()
  image: string;
}

@ObjectType()
export class PresQuestion {
  @Field(() => String, { nullable: true })
  @Prop()
  presQuestionUUID?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  question: string;

  @Field(() => [String], { nullable: true })
  @Prop()
  options: string[];

  @Field(() => [String], { nullable: true })
  @Prop()
  answer: string[];

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
export class Preview {
  @Field(() => Number, { nullable: true })
  @Prop()
  id: number;

  @Field(() => String, { nullable: true })
  @Prop()
  type: string;

  @Field(() => String, { nullable: true })
  @Prop()
  slideImage: string;

  @Field(() => String, { nullable: true })
  @Prop()
  coverImage: string;

  @Field(() => ProfileImg, { nullable: true })
  @Prop()
  profileImg: ProfileImg;

  @Field(() => String, { nullable: true })
  @Prop()
  title: string;

  @Field(() => String, { nullable: true })
  @Prop()
  subTitle: string;

  @Field(() => String, { nullable: true })
  @Prop()
  template: string;

  @Field(() => String, { nullable: true })
  @Prop()
  backgroundColor: string;

  @Field(() => String, { nullable: true })
  @Prop()
  font: string;

  @Field(() => GraphQLJSON, { nullable: true })
  content: string | Record<string, any>;

  @Field(() => [PresQuestion], { nullable: true })
  @Prop()
  questions: PresQuestion[];

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    enum: EngageType,
  })
  questionType: EngageType;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    enum: PresQuizType,
  })
  quizType: PresQuizType;

  @Field(() => String, { nullable: true })
  @Prop()
  answerPoints: string;

  @Field(() => String, {
    nullable: true,
    description: 'The time is in the following format: HH:MM:SS',
  })
  @Prop()
  time: string;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  randomize: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  answerIndicator: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  showExplanation: boolean;

  @Field(() => Boolean, { nullable: true })
  @Prop()
  allowMultiAnswer: boolean;
}
