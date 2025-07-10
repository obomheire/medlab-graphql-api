import { ObjectType, Field } from '@nestjs/graphql';
import { UserEntity } from 'src/user/entity/user.entity';

@ObjectType()
export class LoginRes {
  @Field(() => UserEntity, { nullable: true })
  user?: UserEntity;

  @Field(() => String, { nullable: true })
  access_token?: string;

  @Field(() => String, { nullable: true })
  message?: string;
}

@ObjectType()
export class MessageRes {
  @Field(() => String)
  message: string;

  @Field(() => [String], { nullable: true })
  questionUUIDs?: string[];
}

@ObjectType()
export class RefrestTokenRes {
  @Field(() => String)
  access_token: string;

  @Field(() => String)
  refresh_token: string;
}

@ObjectType()
export class CalculateRankingRes {
  @Field(() => Number, { nullable: true })
  userRanking: number;
}
