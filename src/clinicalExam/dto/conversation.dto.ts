import { InputType, Field, ArgsType } from '@nestjs/graphql';
import { PaginationArgs } from 'src/quiz/dto/question.input';

@InputType()
export class ConvExaminerInput {
  @Field(() => String)
  agentId: string;

  @Field(() => String)
  conversationId: string;
}

@InputType()
export class ConvExaminersInp {
  @Field(() => ConvExaminerInput)
  examiner1: ConvExaminerInput;

  @Field(() => ConvExaminerInput)
  examiner2: ConvExaminerInput;
}

@InputType()
export class EndExaminer2Inp {
  @Field(() => String)
  conversationUUID: string;

  @Field(() => String)
  patientConversId: string;

  @Field(() => ConvExaminersInp)
  examiners: ConvExaminersInp;

  @Field(() => String, { nullable: true })
  note: string;
}

@InputType()
export class SubmitSCGradeInp {
  @Field(() => String)
  conversationUUID: string;

  @Field(() => Number)
  technique: number;

  @Field(() => Number)
  interaction: number;

  @Field(() => Number)
  accuracy: number;

  @Field(() => Number)
  interpretation: number;

  @Field(() => Number)
  investigation: number;

  @Field(() => String, { nullable: true })
  comment: string;
}

@InputType()
export class SubmitLCGradeInp {
  @Field(() => String)
  conversationUUID: string;

  @Field(() => Number)
  accOfHistory: number;

  @Field(() => Number)
  synthesis: number;

  @Field(() => Number)
  understanding: number;

  @Field(() => Number)
  accOfExam: number;

  @Field(() => Number)
  development: number;

  @Field(() => String, { nullable: true })
  comment: string;
}

@InputType()
export class SubmitPresLCinp {
  @Field(() => String)
  practCaseCatUUID: string;

  @Field(() => String)
  patientAgentId: string;
}

@ArgsType()
export class GetCovByCaseArgs extends PaginationArgs {
  @Field(() => String)
  practCaseCatUUID: string;
}
