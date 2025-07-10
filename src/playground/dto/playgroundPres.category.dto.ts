import { Field, InputType, PartialType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from "class-validator";
import { PresInput } from "src/presentation/dto/presentation.input";

@InputType()
export class CreatePlaygroundPresCategoryDto {

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  category: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  topic: string;
}

@InputType()
export class UpdatePlaygroundPresCategoryDto extends PartialType(CreatePlaygroundPresCategoryDto) {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  categoryUUID: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subCategory: string;
}

@InputType()
export class PlaygroundPresInput extends PresInput {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isEmbeded: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isUrlType: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isUploadType: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isPublished: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isBulk: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  inReview: boolean;
}

@InputType()
export class PlaygroundPresSettingsInput {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  canForward: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  showLeaderboard: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  activateAuthorAvatar: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  activateAIComment: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  activateAIQuestion: boolean;
}
