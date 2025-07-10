import { Field, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import { MedSynopsisGameType } from '../enum/medsynopsis.enum';

@ObjectType()
export class ScoreRecord {
  @Field(() => Number)
  @Prop({ type: Number, default: 0 })
  accuracy: number;

  @Field(() => Number)
  @Prop({ type: Number, default: 0 })
  clarityConciseness: number;

  @Field(() => Number)
  @Prop({ type: Number, default: 0 })
  relevance: number;

  @Field(() => Number)
  @Prop({ type: Number, default: 0 })
  organizationStructure: number;

  @Field(() => Number)
  @Prop({ type: Number, default: 0 })
  timeOfCompletion: number;
}

@ObjectType()
export class UserSummaryDetail {
  @Field(() => String)
  @Prop({ type: String, required: true })
  caseUUID: string;

  @Field(() => String)
  @Prop({
    type: String,
    default: MedSynopsisGameType.TIMED,
    enum: MedSynopsisGameType,
  })
  gameType: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  userSummary: string;

  @Field(() => ScoreRecord)
  @Prop({ type: ScoreRecord, required: true })
  scoreRecord: ScoreRecord;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  assignedTime: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  completionTime: string;

  @Field(() => Number)
  @Prop({ type: Number, default: 0 })
  score: number;
}

@ObjectType()
export class UserRecord {
  @Field(() => String)
  @Prop({ type: String, required: true })
  categoryName: string;

  @Field(() => [UserSummaryDetail])
  @Prop({ type: [UserSummaryDetail] })
  content: UserSummaryDetail[];

  @Field(() => Number)
  @Prop({ type: Number, required: true })
  totalScore: number;

  @Field(() => Number)
  @Prop({ type: Number, required: true })
  totalTimedScore: number;

  @Field(() => Number)
  @Prop({ type: Number, required: true })
  totalUntimedScore: number;
}

@ObjectType()
export class IMedSynopsisCase {
  @Field(() => String)
  caseUUID: string;

  @Field(() => String)
  categoryUUID: string;

  @Field(() => String)
  caseTitle: string;

  @Field(() => String)
  caseContent: string;

  @Field(() => String)
  question: string;

  @Field(() => String)
  caseSummary: string;
}

@ObjectType()
export class MedSysnopsisUserCaseProp {
  @Field(() => String)
  @Prop({ type: String })
  caseID: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  caseContent: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  userSummary: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  fileName?: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  messageId?: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  threadId?: string;
}
