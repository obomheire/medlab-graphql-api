import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ImageUrlRes {
  @Field(() => String)
  secure_url: string;
}

@ObjectType()
export class Quizzer {
  @Field(() => Int, { nullable: true })
  ranking: number;

  @Field(() => Float)
  totalPoints: number;

  @Field(() => Float)
  totalTimeTaken: number;
}

@ObjectType()
export class LeaderBoardRes {
  @Field(() => String, { nullable: true })
  userUUID: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  profileImage: string;
  @Field(() => String, { nullable: true })
  region: string;
  @Field(() => String, { nullable: true })
  component: string;
  @Field(() => Int, { nullable: true })
  ranking: number;

  @Field(() => Float)
  totalPoints: number;

  @Field(() => Float)
  totalTimeTaken: number;
}

@ObjectType()
export class PerformanceRes {
  @Field(() => Number, { nullable: true })
  correct: number;

  @Field(() => Number, { nullable: true })
  incorrect: number;

  @Field(() => Number, { nullable: true })
  missed: number;
}

@ObjectType()
export class SpecialtyRes {
  @Field(() => String, { nullable: true })
  specialty: string;

  @Field(() => String, { nullable: true })
  specialtyUUID: string;
}

@ObjectType()
export class SubspecialtyRes {
  @Field(() => String, { nullable: true })
  subspecialty: string;
}
