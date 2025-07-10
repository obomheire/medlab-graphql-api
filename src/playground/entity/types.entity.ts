import { Field, ObjectType } from "@nestjs/graphql";
import { Prop } from "@nestjs/mongoose";

@ObjectType()
export class PlaygroundTopicsAndSubtopicsType {
  @Field(() => String, { nullable: true })
  @Prop({ type: String, nullable: true })
  topic: string;

  @Field(() => [String], { nullable: true })
  @Prop({ type: [String], nullable: true })
  subtopic: string[];
}


@ObjectType()
export class PlaygroundMasterOutlineTypes {
  @Field(() => String, { nullable: true })
  @Prop({ type: String, nullable: true })
  system: string;

  @Field(() => [PlaygroundTopicsAndSubtopicsType], { nullable: true })
  @Prop({ type: [PlaygroundTopicsAndSubtopicsType], nullable: true })
  data: PlaygroundTopicsAndSubtopicsType[];
}

@ObjectType()
export class PlaygroundTypesEntity {
  @Field(() => [PlaygroundMasterOutlineTypes], { nullable: true })
  @Prop({ type: [PlaygroundMasterOutlineTypes], nullable: true })
  content: PlaygroundMasterOutlineTypes[];

  @Field(() => String, { nullable: true })
  @Prop({ type: String, nullable: true })
  masterOutlineTemplate: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, nullable: true })
  fileName: string;
}


@ObjectType()
export class PlaygroundTemplateTypeEntity {
  @Field(() => String, { nullable: true })
  @Prop({ type: String, nullable: true })
  content: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, nullable: true })
  fileName: string;
}

@ObjectType()
export class PlaygroundSampleQuestionTypeEntity {
  @Field(() => String, { nullable: true })
  @Prop({ type: String, nullable: true })
  content: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, nullable: true })
  fileName: string;
}

