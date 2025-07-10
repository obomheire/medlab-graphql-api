import { Field, Float, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Pagination } from 'src/quiz/types/quiz.types';
import { ClinicalExamEntity } from '../entity/clinicalExams.entity';
import { FaqEntity } from '../entity/faq.entity';
import { PractCaseCatEntity } from '../entity/practCaseCat.entity';
import { PractCaseEntity } from '../entity/practCase.entity';
import { ConversationEntity } from '../entity/conversation.entity';
import { ClinicalExamTutorialEntity } from '../entity/clinicalExams.tutorial.entity';
import { UserQuizScoreEntity } from 'src/quiz/entity/userQuizScoreEntity';

@ObjectType()
export class Instruction {
  @Field(() => String)
  shortCase: string;

  @Field(() => String)
  longCase: string;
}

@ObjectType()
export class GetClinicalExamsRes {
  @Field(() => [ClinicalExamEntity])
  clinicalExams: ClinicalExamEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class GetFaqsRes {
  @Field(() => [FaqEntity])
  faqs: FaqEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class PractCaseCatRes {
  @Field(() => [PractCaseCatEntity])
  practCaseCats: PractCaseCatEntity[];

  @Field(() => Instruction)
  instructions: Instruction;

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class PractCaseRes {
  @Field(() => [PractCaseEntity])
  practCases: PractCaseEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class UploadTutorialArticleRes {
  @Field(() => String, { nullable: true })
  article?: string;

  @Field(() => String)
  sectionUUID: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  videoUrl: string;

  @Field(() => String)
  note: string;
}

@ObjectType()
export class CreateTemplateRes {
  @Field(() => String)
  category: string; //this is the exam category the template belongs to

  @Field(() => String)
  templateUUID: string;
}

@ObjectType()
export class CreateTemplateCategoryRes {
  @Field(() => String, { nullable: true })
  categoryUUID: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => String, { nullable: true })
  icon: string;
}

@ObjectType()
export class GetTemplateCategoryCasesRes {
  @Field(() => String)
  name: string;

  @Field(() => String)
  caseUUID: string;

  @Field(() => String)
  content: string;
}

@ObjectType()
export class ShortCaseRes {
  @Field(() => String, { nullable: true })
  caseUUID: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String)
  content: string;
}

@ObjectType()
export class GetShortCasesRecordRes {
  @Field(() => String)
  title: string;

  @Field(() => [ShortCaseRes])
  cases: ShortCaseRes[];
}

@ObjectType()
export class GetShortCasesTemplateRes {
  @Field(() => String)
  title: string;
}

@ObjectType()
export class GetTemplateCaseRecordsRes {
  @Field(() => String)
  content: string;

  @Field(() => String)
  recordUUID: string;
}

@ObjectType()
export class SubmitPresLCres {
  @Field(() => String)
  conversationUUID: string;
}

@ObjectType()
export class GetCovByCaseRes {
  @Field(() => [ConversationEntity])
  conversations: ConversationEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class GetTutorialByCatNameRes extends ClinicalExamTutorialEntity {
  @Field(() => [UserQuizScoreEntity], { nullable: true })
  quizResult?: UserQuizScoreEntity[];

  @Field(() => String)
  progress: string;
}
