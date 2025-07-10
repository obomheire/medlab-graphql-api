/* eslint-disable prettier/prettier */
import { ObjectType, Field, Int, Float, ArgsType } from '@nestjs/graphql';
import { QuestionEntity } from '../entity/questions.entity';
import { GraphQLJSON } from 'graphql-type-json';
import { CategoryData } from 'src/utilities/interface/interface';
import { CaseEntity } from '../entity/case.entity';
import { Option, Subcategory } from '../entity/type.entity';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { CategoryType } from '../enum/quiz.enum';

@ArgsType()
export class CategoryArgs {
  @Field(() => String, { nullable: true })
  @IsEnum(CategoryType)
  @IsOptional()
  category: CategoryType;
}

@ObjectType()
export class Pagination {
  @Field(() => Number, { nullable: true })
  totalRecords: number;

  @Field(() => Number, { nullable: true })
  totalPages: number;

  @Field(() => Number, { nullable: true })
  pageSize: number;

  @Field(() => Number, { nullable: true })
  prevPage: number;

  @Field(() => Number, { nullable: true })
  currentPage: number;

  @Field(() => Number, { nullable: true })
  nextPage: number;
}

@ObjectType()
export class Subcat {
  @Field(() => String, { nullable: true })
  id: string;

  @Field(() => String, { nullable: true })
  subcat: string;
}

@ObjectType()
export class TransformedData {
  @Field(() => GraphQLJSON)
  categories: { [key: string]: CategoryData };
}

@ObjectType()
export class QBCatRes {
  @Field(() => String)
  quizUUID: string;

  @Field(() => Int, { nullable: true })
  totalQuestion: number;

  @Field(() => String, { nullable: true })
  qbQuizCategory: string;
}

@ObjectType()
export class QBCategoryRes {
  @Field(() => [QBCatRes])
  qbQuizCat: QBCatRes[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class SubcategoryRes {
  @Field(() => Subcat, { nullable: true })
  subcategory: Subcat;

  @Field(() => Int, { nullable: true })
  totalNumber: number;

  @Field(() => String, { nullable: true })
  coverImage: string;
}

@ObjectType()
export class ClinicialSubspecialtyRes {
  @Field(() => String, { nullable: true })
  subspecialty: string;

  @Field(() => Int, { nullable: true })
  totalNumber: number;

  @Field(() => String, { nullable: true })
  coverImage: string;
}

@ObjectType()
export class MedicalExamsSubjectsRes {
  @Field(() => String, { nullable: true })
  subject: string;

  @Field(() => String, { nullable: true })
  category: string;

  @Field(() => String, { nullable: true })
  subcategory: string;

  @Field(() => Int, { nullable: true })
  totalNumber: number;

  @Field(() => String, { nullable: true })
  coverImage: string;
}

@ObjectType()
export class GetQuestionRes {
  @Field(() => String)
  encryptQuestion: string;
}

@ObjectType()
export class GetMyQuesRes {
  @Field(() => [QuestionEntity])
  questions: QuestionEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class GetCasesQuesRes {
  @Field(() => [CaseEntity])
  cases: CaseEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class SubmitQRes {
  @Field(() => Float)
  totalPoints: number;

  @Field(() => Number, { nullable: true })
  totalCorrect: number;

  @Field(() => Number, { nullable: true })
  totalIncorrect: number;

  @Field(() => Number, { nullable: true })
  totalMissed: number;

  @Field(() => Number, { nullable: true })
  totalSpeedBonus: number;

  @Field(() => Float, { nullable: true })
  totalScore: number;

  @Field(() => Number, { nullable: true })
  userRanking: number;
}

@ObjectType()
export class GetTopicRes {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  topic: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  subtopics: string[];
}

@ObjectType()
export class GetSystemsRes {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  system: string;

  @Field(() => [GetTopicRes], { nullable: true })
  @IsArray()
  @IsOptional()
  topics: GetTopicRes[];
}

@ObjectType()
export class GetQuestionsRes_v2 {
  @Field(() => [QuestionEntity], { nullable: true })
  @IsArray()
  @IsOptional()
  resultBySubCat: QuestionEntity[];

  @Field(() => [QuestionEntity], { nullable: true })
  @IsArray()
  @IsOptional()
  resultBySystem: QuestionEntity[];

  @Field(() => [QuestionEntity], { nullable: true })
  @IsArray()
  @IsOptional()
  resultByTopic: QuestionEntity[];

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isLessBySystems: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isLessBySystemsTopic: boolean;
}

@ObjectType()
export class OpenEndedIncoming {
  @Field({ nullable: true })
  questionUUID: string;

  @Field()
  question: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  expectedAnswer: string[];

  @Field(() => String)
  expectedAnswerDetails: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  userAnswer: string[];

  @Field({ nullable: true })
  mode?: string;

  @Field(() => Number, { nullable: true })
  assignedTime?: number;

  @Field(() => Number)
  timeTaken: number;
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

  @Field(() => Number)
  speedBonus: number;
}

@ObjectType()
export class ScoreGroup {
  @Field(() => Number, { defaultValue: 0 })
  score: number;

  @Field(() => Number, { defaultValue: 0 })
  speedBonus: number;
}

@ObjectType()
export class OpenEndedItemsRes {
  @Field(() => OpenEndedIncoming, { nullable: true })
  question: OpenEndedIncoming;

  @Field(() => String, { nullable: true })
  feedback: string;

  @Field(() => Number, { defaultValue: 0 })
  speedBonus: number;

  @Field(() => Number, { defaultValue: 0 })
  score: number;
}

@ObjectType()
export class OpenEndedQuizScoreRes {
  @Field(() => ScoreGroup)
  overallGrade: ScoreGroup;

  @Field(() => [OpenEndedItemsRes], { nullable: true })
  @IsOptional()
  items: OpenEndedItemsRes[];
}

@ObjectType()
export class ScoreRes {
  @Field(() => Number)
  totalScore: number;

  @Field(() => Number)
  userRanking: number;
}

@ObjectType()
export class UploadQsImageRes {
  @Field(() => [String], { nullable: true })
  imageUrls: string[];
}

@ObjectType()
export class GameRes {
  @Field(() => String, { nullable: true })
  inviteCode: string;
}

@ObjectType()
export class OpenEndedAnswer {
  @Field(() => String)
  id: string;

  @Field(() => [String], { nullable: true })
  answer: string[];

  @Field(() => String, { nullable: true })
  reference: string;

  @Field(() => String, { nullable: true })
  answer_details: string;
}

@ObjectType()
export class SubcategoryType {
  @Field(() => String, { nullable: true })
  id: string;

  @Field(() => String, { nullable: true })
  subcat: string;
}

@ObjectType()
export class GenerateOpenEndedQuesRes {
  @Field(() => String, { nullable: true })
  questionUUID?: string;

  @Field(() => String, { nullable: true })
  quizUUID?: string;

  @Field(() => Number, { nullable: true })
  duration?: number;

  @Field(() => String, { nullable: true })
  timer?: string;

  @Field(() => Number, { nullable: true })
  point?: number;

  @Field(() => String, { nullable: true })
  caseUUID?: string;

  @Field(() => [String], { nullable: true })
  images: string[];

  @Field(() => String)
  question: string;

  @Field(() => String, { nullable: true })
  mode?: string;

  @Field(() => Number, { nullable: true })
  questionNumber?: number;

  @Field(() => [Option])
  options: Option[];

  @Field(() => OpenEndedAnswer)
  answer: OpenEndedAnswer;

  @Field(() => String, { nullable: true })
  subject?: string;

  @Field(() => String, { nullable: true })
  category?: string;

  @Field(() => String, { nullable: true })
  quizCategoryId?: string;

  @Field(() => SubcategoryType, { nullable: true })
  subcategory?: SubcategoryType;

  @Field(() => String, { nullable: true }) // To be removed
  topic?: string;

  @Field(() => String, { nullable: true })
  subtopic?: string;

  @Field(() => String, { nullable: true })
  keywords?: string;

  @Field(() => Boolean, { nullable: true })
  reviewed?: boolean;

  @Field(() => String, { nullable: true })
  comments?: string;

  @Field(() => Number, { nullable: true })
  level?: number;

  @Field(() => [String], { nullable: true })
  presentedTo?: string[];
}

@ObjectType()
export class ReviewOpenEndedQuesType {
  @Field(() => String, { nullable: true })
  question: string;

  @Field(() => String, { nullable: true })
  questionUUID: string;

  @Field(() => String, { nullable: true })
  subspecialty: string;

  @Field(() => String, { nullable: true })
  specialty: string;

  @Field(() => String, { nullable: true })
  reference: string;

  @Field(() => String, { nullable: true })
  topic: string;

  @Field(() => String, { nullable: true })
  subtopic: string;

  @Field(() => String, { nullable: true })
  reviewed: string;

  @Field(() => String, { nullable: true })
  comments: string;

  @Field(() => String, { nullable: true })
  answer: string;

  @Field(() => String, { nullable: true })
  answer_details: string;
}

@ObjectType()
export class ReviewOpenEndedQuesRes {
  @Field(() => [ReviewOpenEndedQuesType])
  questions: ReviewOpenEndedQuesType[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class OpenEndedQuesCount {
  @Field(() => String)
  category: string;

  @Field(() => String)
  coverImage: string;

  @Field(() => Number)
  count: number;
}

@ObjectType()
export class Stat {
  @Field(() => String)
  option: string;

  @Field(() => Int)
  percentage: number;
}

@ObjectType()
export class SubmitVoteRes {
  @Field(() => String)
  questionUUID: string;

  @Field(() => String)
  question: string;

  @Field(() => [Option])
  options: Option[];

  @Field(() => [Stat], { nullable: true })
  statistics: Stat[];
}
