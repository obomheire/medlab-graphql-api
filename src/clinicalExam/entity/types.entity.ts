import { Field, Float, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import {
  CaseType,
  GenderType,
  TemplateCaseType,
  TutorialQuizType,
  TutorialStatus,
} from '../enum/clinicalExam.enum';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserQuizScoreEntity } from 'src/quiz/entity/userQuizScoreEntity';

@ObjectType()
export class SampleQues {
  @Field(() => String, { nullable: true })
  @Prop()
  longCase: string;

  @Field(() => String, { nullable: true })
  @Prop()
  shortCase: string;
}

@ObjectType()
export class Instruction extends SampleQues {}

@ObjectType()
export class ShortCase {
  @Field(() => Number, { nullable: true })
  @Prop()
  technique: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  accuracy: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  interaction: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  interpretation: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  investigation: number;
}

@ObjectType()
export class LongCase {
  @Field(() => Number, { nullable: true })
  @Prop()
  accOfHistory: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  synthesis: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  understanding: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  accOfExam: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  development: number;
}

@ObjectType()
export class Examiner {
  @Field(() => String)
  @Prop()
  agentId: string;

  @Field(() => String)
  @Prop()
  name: string;

  @Field(() => String)
  @Prop()
  image: string;

  @Field(() => String)
  @Prop()
  voice: string;

  @Field(() => String)
  @Prop()
  gender: string;
}

@ObjectType()
export class ConvExaminer extends PickType(Examiner, ['agentId'] as const) {
  @Field(() => String)
  @Prop()
  conversationId: string;
}

@ObjectType()
export class ConvExaminers {
  @Field(() => ConvExaminer)
  @Prop()
  examiner1: ConvExaminer;

  @Field(() => ConvExaminer)
  @Prop()
  examiner2: ConvExaminer;
}

@ObjectType()
export class Examiners {
  @Field(() => Examiner)
  @Prop()
  examiner1: Examiner;

  @Field(() => Examiner)
  @Prop()
  examiner2: Examiner;
}

@ObjectType()
export class PatientProfile {
  @Field(() => String)
  @Prop()
  name: string;

  @Field(() => String)
  @Prop()
  dob: string;

  @Field(() => Number)
  @Prop()
  age: number;

  @Field(() => String)
  @Prop()
  gender: GenderType;

  @Field(() => String)
  @Prop()
  ethnicity: string;

  @Field(() => String)
  @Prop()
  image: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  agentId: string;
}

/**Section for Tutorial */
@ObjectType()
export class TutorialSectionQuiz {
  @Field(() => String)
  @Prop({ default: uuidv4 })
  questionUUID: string;

  @Field(() => String)
  @Prop()
  question: string;

  @Field(() => [String])
  @Prop()
  options: string[];

  @Field(() => String)
  @Prop()
  answer: string;

  @Field(() => String)
  @Prop()
  answer_details: string;

  @Field(() => String, { nullable: true })
  @Prop({ enum: TutorialQuizType, default: TutorialQuizType.MULTIPLE_CHOICE })
  type?: TutorialQuizType;
}

@ObjectType()
export class UserQuizScore {
  @Field(() => String)
  @Prop()
  questionUUID: string;

  @Field(() => String)
  @Prop()
  answer: string;

  @Field(() => String)
  @Prop()
  answer_details: string;

  @Field(() => String)
  @Prop()
  score: string;
}

@ObjectType()
export class TutorialSectionReading {
  @Field(() => UserEntity)
  @Prop()
  user: UserEntity;

  @Field(() => String)
  @Prop({ enum: TutorialStatus, default: TutorialStatus.NOT_STARTED })
  readingStatus: TutorialStatus;

  @Field(() => String)
  @Prop()
  articleUUID?: string;

  //this is only for the frontend to display the quiz result
  @Field(() => [UserQuizScoreEntity], { nullable: true })
  @Prop({ nullable: true, default: [] })
  quizResult?: UserQuizScoreEntity[];
}

@ObjectType()
export class TutorialSectionType {
  @Field(() => String, { nullable: true })
  @Prop()
  sectionUUID: string;

  @Field(() => String, { nullable: true })
  @Prop()
  title: string;

  @Field(() => String, { nullable: true })
  @Prop()
  article: string;

  @Field(() => String, { nullable: true })
  @Prop()
  videoUrl: string;

  @Field(() => String, { nullable: true })
  @Prop()
  transcript?: string;

  @Field(() => String, { nullable: true })
  @Prop()
  note: string;

  @Field(() => [String], { nullable: true })
  @Prop()
  slides: string[];

  @Field(() => [TutorialSectionReading], { nullable: true })
  @Prop()
  userData: TutorialSectionReading[];
}

/**End of tutorial */

/**Section for Template */

@ObjectType()
export class TemplateCase {
  @Field(() => String, { nullable: true })
  @Prop()
  caseUUID: string;

  @Field(() => String, { nullable: true })
  @Prop()
  name: string;

  @Field(() => String)
  @Prop()
  content: string;
}

@ObjectType()
export class ShortCaseTemplate {
  @Field(() => String)
  @Prop({ type: String })
  title: string;

  @Field(() => [TemplateCase], { nullable: true })
  @Prop({ type: String })
  cases: TemplateCase[];
}

@ObjectType()
export class TemplateCategory {
  @Field(() => String, { nullable: true })
  @Prop()
  categoryUUID: string;

  @Field(() => String)
  @Prop()
  name: string;

  @Field(() => String, { nullable: true })
  @Prop()
  description: string;

  @Field(() => String, { nullable: true })
  @Prop()
  image: string;

  @Field(() => String, { nullable: true })
  @Prop()
  icon: string;

  @Field(() => [ShortCaseTemplate], { nullable: true })
  shortCases: ShortCaseTemplate[];

  @Field(() => [TemplateCase], { nullable: true })
  longCases: TemplateCase[];
}
/**End of Template Section */

@ObjectType()
export class EndPatientInterRes {
  @Field(() => String)
  @Prop()
  examiner1Id: string;

  @Field(() => String)
  @Prop()
  conversationUUID: string;
}

@ObjectType()
export class EndExaminer1InterRes extends PickType(EndPatientInterRes, [
  'conversationUUID',
] as const) {
  @Field(() => String)
  @Prop()
  examiner2Id: string;
}
