import { ObjectType } from "@nestjs/graphql";
import { Field } from "@nestjs/graphql";
import { PlaygroundPresentationEntity } from "../entity/presentation.playground.entity";

@ObjectType()
export class PlaygroundSlideUploadRes {
    @Field(() => [String], { nullable: true })
    slides: string[];

    @Field(() => String, { nullable: true })
    embedLink: string;

    @Field(() => Boolean, { nullable: true })
    isUpload: boolean;

    @Field(() => Boolean, { nullable: true })
    isEmbed: boolean;

    @Field(() => Boolean, { nullable: true })
    isUrl?: boolean;
}

@ObjectType()
export class AllCategoriesRes {
    @Field(() => String, { nullable: true })
    subCategory: string;

    @Field(() => String, { nullable: true })
    topic: string;

    @Field(() => [PlaygroundPresentationEntity], { nullable: true })
    presentations: PlaygroundPresentationEntity[];
}

@ObjectType()
export class PlaygroundSlideAllCategoriesRes {
    @Field(() => String, { nullable: true })
    category: string;

    @Field(() => [AllCategoriesRes], { nullable: true })
    subCategories: AllCategoriesRes[];
}
