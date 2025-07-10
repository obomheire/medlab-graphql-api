/* eslint-disable prettier/prettier */
import { Field, ObjectType } from '@nestjs/graphql';
import { MedSynopsisCaseEntity } from '../entity/medsynopsisCase.entity';
import { Pagination } from 'src/quiz/types/quiz.types';
import { Optional } from '@nestjs/common';

@ObjectType()
export class MedCategoryType {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  coverImage: string;
}

@ObjectType()
export class MedsynopsisCaseType {
  @Field(() => String)
  caseTitle: string;

  @Field(() => String)
  caseContent: string;

  @Field(() => String)
  caseCategoryUUID: string;

  @Field(() => String)
  caseSummary: string;

  @Field(() => String)
  question: string;
}

@ObjectType()
export class MedScoreRecordType {
  @Field(() => Number)
  accuracy: number;

  @Field(() => Number)
  clarityConciseness: number;

  @Field(() => Number)
  relevance: number;

  @Field(() => Number)
  organizationStructure: number;

  @Field(() => Number)
  completionTime: number;
}

@ObjectType()
export class MedUserSummaryDetailType {
  @Field(() => String)
  caseUUID: string;

  @Field(() => String)
  gameType: string;

  @Field(() => String)
  userSummary: string;

  @Field(() => MedScoreRecordType)
  scoreRecord: MedScoreRecordType;

  @Field(() => Number, { nullable: true })
  assignedTime: number;

  @Field(() => Number, { nullable: true })
  completionTime: number;

  @Field(() => Number)
  score: number;
}

@ObjectType()
export class MedUserScoreRes {
  @Field()
  score: number;

  @Field()
  scoreSummary: MedScoreRecordType;

  @Field()
  userSummary: string;

  @Field({nullable: true})
  aIFeedback?: string;

  @Field()
  caseAISummary: string;

  @Field({nullable: true})
  chatThreadId?: string
}

@ObjectType()
export class MedAISummaryRes {
  @Field(() => Number, { nullable: true })
  'Accuracy': number;

  @Field(() => Number, { nullable: true })
  'Clarity and Conciseness': number;

  @Field(() => Number, { nullable: true })
  'Relevance': number;

  @Field(() => Number, { nullable: true })
  'Organization and Structure': number;

  @Field(() => Number, { nullable: true })
  'Completion Time': number;

  @Field(() => Number, { nullable: true })
  'Total Score': number;
}

@ObjectType()
export class MedSynopsisUserCaseRes{
    @Field(()=> String)
    caseContent: string;

    @Field(()=> String)
    userSummary: string;

    @Field(()=>String, {nullable: true})
    fileUrl?: string;

    @Field(()=>String)
    caseID: string

    @Field(()=>String, {nullable: true})
    @Optional()
    threadId?: string

    @Field(()=>String, {nullable: true})
    messageId?: string
}

@ObjectType()
export class MedSynopsisUserRecordType {
  @Field(() => String)
  categoryName: string;

  @Field(() => [MedUserSummaryDetailType])
  content: MedUserSummaryDetailType[];

  @Field(() => Number)
  totalScore: number;
}

@ObjectType()
export class MedsynopsisUserType {
  @Field(() => String)
  userUUID: string;

  @Field(() => String)
  caseUUID: string;

  @Field(() => String, {
    description: 'The acceptable type is either timed or untimed',
  })
  gameType: string;

  @Field(() => String, { nullable: true })
  assignedTime: string;

  @Field(() => String, { nullable: true })
  completionTime: string;

  @Field(() => String)
  categoryName: string;

  @Field(() => String)
  userSummary: string;
}

@ObjectType()
export class IMedRandomQuestionRes {
  @Field()
  categoryTitle: string;

  @Field()
  caseUUID: string;

  @Field(() => String)
  categoryUUID: string;

  @Field(() => String)
  caseTitle: string;

  @Field(() => String)
  caseContent: string;

  @Field(() => String)
  question: string;
}


@ObjectType()
export class IMedSynopsisCategoryRes {
  @Field()
  categoryUUID: string;
  
  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  coverImage?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class GetMedSynopsisCaseRes {
  @Field(() => [MedSynopsisCaseEntity])
  cases: MedSynopsisCaseEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class RandomQuestionRes{
    @Field(()=>String)
    caseUUID: string;

    @Field(()=>String)
    caseContent: string;

    @Field(()=>String)
    categoryUUID: string;

    @Field(()=>String)
    caseTitle: string;

    @Field(()=>String)
    categoryName: string;
}