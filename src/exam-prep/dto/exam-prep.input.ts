import { InputType, Field } from "@nestjs/graphql";
import { IsOptional, IsString } from "class-validator";
import { FileUpload } from 'graphql-upload-ts';

@InputType()
export class ExamPrepConfigDto {
  @Field(() => String)
  examName: string;

  @Field(() => String, {nullable: true})
  @IsString()
  @IsOptional()
  examDate: string;

  @Field(() => String, {nullable: true})
  @IsString()
  @IsOptional()
  examKnowledgeLevel: string;

  @Field(() => String, {nullable: true})
  @IsString()
  @IsOptional()
  examCurriculumLinkOrText: string;


  @Field(() => String, {nullable: true})
  @IsString()
  @IsOptional()
  sampleQuestions?: string;

  @Field(() => String, {nullable: true})
  @IsString()
  @IsOptional()
  additionalInfo?: string;
}

@InputType()
export class ExamPrepConfigInput extends ExamPrepConfigDto {
    @Field(() => String, {nullable: true})
    @IsString()
    @IsOptional()
    examCurriculumFile?: Promise<FileUpload>;

    @Field(() => String, {nullable: true})
    @IsString()
    @IsOptional()
    examQuestionFile?: string;
}

@InputType()
export class SelectedTopics {
  @Field(()=>[String])
  topics: string[]
}
