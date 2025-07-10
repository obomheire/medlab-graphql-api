import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExamPrepLearningPathRes {
  @Field(() => String)
  learningPathUUID: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  duration: string;

  @Field(() => [LearningPath])
  learningPath: LearningPath[];

  @Field(() => [String], { nullable: true })
  assessingProgress?: string[];
}

@ObjectType()
export class LearningPath {
  @Field(() => String)
  step: string;

  @Field(() => String)
  subject: string;

  @Field(() => [Topic])
  topics: Topic[];

  @Field(() => [QuestionsArea], { nullable: true })
  questionsAreas?: QuestionsArea[];
}

@ObjectType()
export class Topic {
  @Field(() => String)
  title: string;

  @Field(() => [String], { nullable: true })
  subTopics?: string[];
}

@ObjectType()
export class QuestionsArea {
  @Field(() => String)
  text: string;

  @Field(() => String, { nullable: true })
  link?: string;

  @Field(() => String, { nullable: true })
  image?: string;
}

@ObjectType()
export class QuestionsRes {
  @Field(() => String)
  title: string;

  @Field(() => [QuestionsResType], { nullable: true })
  questions?: QuestionsResType[];
}

@ObjectType()
export class QuestionsResType {
  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => String, { nullable: true })
  subject?: string;

  @Field(() => String, { nullable: true })
  topic?: string;

  @Field(() => String, { nullable: true })
  subtopic?: string;

  @Field(() => String)
  questionId: string;

  @Field(() => [String], { nullable: true })
  answer?: string[];

  @Field(() => String, { nullable: true })
  question?: string;

  @Field(() => [String], { nullable: true })
  options?: string[];
}
