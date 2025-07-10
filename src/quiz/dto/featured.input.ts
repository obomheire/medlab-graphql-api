import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateFeaturedInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  color: string;

  @Field(() => String)
  image: string;

  @Field(() => String)
  route: string;

  @Field(() => String, { nullable: true })
  quizUUID: string;

  @Field(() => String, { nullable: true })
  category: string;

  @Field(() => Boolean, { nullable: true })
  isGuest: boolean;
}

@InputType()
export class UpdateFeaturedInput extends PartialType(CreateFeaturedInput) {
  @Field(() => String)
  featureUUID: string;
}
