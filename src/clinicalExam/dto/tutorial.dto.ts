import { Field, InputType } from "@nestjs/graphql";
import { TutorialSectionType } from "../entity/types.entity";
import { TutorialQuizType } from "../enum/clinicalExam.enum";

@InputType()
export class UploadTutArticleDto {
  @Field(() => String)
  category: string;

  @Field(() => String)
  title: string;
}

@InputType()
export class TutorialQuizDto {
  @Field(() => String)
  question: string;

  @Field(() => String)
  answer: string;

  @Field(() => String)
  answer_details: string;

  @Field(() => String, { nullable: true })
  optionA: string;

  @Field(() => String, { nullable: true })
  optionB: string;

  @Field(() => String, { nullable: true })
  optionC: string;

  @Field(() => String, { nullable: true })
  optionD: string;

  @Field(() => String, { nullable: true, defaultValue: TutorialQuizType.MULTIPLE_CHOICE })
  type: TutorialQuizType;
}


@InputType()
export class AddTutorialSectionQuizDto {
  @Field(() => String)
  category: string;

  @Field(() => String)
  sectionTitle: string;  

  @Field(() => [TutorialQuizDto], { nullable: true })
  quizzes: TutorialQuizDto[];
}

@InputType()
export class IncomingTutorialInput{

  @Field(()=> String)
  category: string

  @Field(()=> String)
  sectionTitle: string

  @Field(()=> Date)
  upcomingTutDate: Date

  @Field(()=> String)
  upcomingTutDuration: string
}
