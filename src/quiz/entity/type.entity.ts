import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import { Question } from 'src/drive/entity/types.entity';
import { EngageType } from '../enum/quiz.enum';
import { PresQuestion } from 'src/presentation/entity/types.entity';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { UserEntity } from 'src/user/entity/user.entity';


@ObjectType()
export class Engagement {
  @Prop()
  id: number;

  @Prop()
  type: string;

  @Prop()
  font: string;

  @Prop()
  questions: PresQuestion[];

  @Prop({
    type: String,
    enum: EngageType,
  })
  questionType: EngageType;

  @Prop()
  answerPoints: string;

  @Prop()
  randomize: boolean;

  @Prop()
  answerIndicator: boolean;
}

@ObjectType()
export class Option {
  @Field(() => String)
  @Prop()
  id: string;

  @Field(() => String)
  @Prop()
  value: string;
}

@ObjectType()
export class Answer {
  @Field(() => String)
  @Prop()
  id: string;

  @Field(() => String)
  @Prop()
  answer: string;

  @Field(() => String, { nullable: true })
  @Prop()
  reference: string;

  @Field(() => String, { nullable: true })
  @Prop()
  answer_details: string;
}

@ObjectType()
export class Subcategory {
  @Field(() => String)
  @Prop()
  id: string;

  @Field(() => String)
  @Prop()
  subcat: string;

  @Field(() => String, { nullable: true })
  @Prop()
  coverImage?: string;
}

export class Score {
  @Prop()
  userUUID: string;

  @Prop()
  firstName: string;

  @Prop()
  plan?: string;

  @Prop()
  url: string;

  @Prop()
  speedBonus: number;

  @Prop()
  speed: number;

  @Prop()
  score: number;

  @Prop()
  correct: number;

  @Prop()
  incorrect: number;
}

export class TotalRes {
  @Prop()
  totalRes: number;
}

@ObjectType()
export class MedscrollQues {
  @Field(() => Boolean, { nullable: true })
  @Prop()
  status: boolean;

  @Field(() => [String], { nullable: true })
  @Prop()
  subcategory: string[];
}

@ObjectType()
export class Vote {
  @Field(() => String)
  @Prop()
  voterUUID: string;

  @Field(() => String)
  @Prop()
  vote: string;
}

@ObjectType()
export class Current {
  @Prop()
  id: number;

  @Prop()
  type: string;
}

@ObjectType()
export class PresUsersScore{
  @Prop({type: [String], nullable: true})
  optionPicked?: string[]

  @Prop({type: Number})
  score: number

  @Prop({type: Number})
  speed: number

  @Prop({type: Number})
  speedBonus: number

  @Prop({type: EngageType})
  type: EngageType

  @Prop({type: String})
  userUUID: string

  @Prop({type: String})
  name: string

  @Prop({type: String, nullable: true})
  profileImage?: string
}

@ObjectType()
export class PresQuestionScore{
    @Prop({type: String})
    presQuestionUUID: string;
  
  @Prop({type: String, enum: EngageType})
  type: EngageType;

  @Prop({type: [String]})
  correctAnswer: string[]

  @Prop({type: String})
  question: string

  @Prop({type: [String]})
  options: string[]

  @Prop({type: [PresUsersScore]})
  userScores: PresUsersScore[]
}

@ObjectType()
export class AIGrade {
  @Field(() => Number)
  accuracy: number;

  @Field(() => Number)
  relevance: number;

  @Field(() => Number)
  clarityAndConciseness: number;

  @Field(() => Number)
  organizationAndStructure: number;

  @Field(() => Number)
  timeToCompletion: number;
}

