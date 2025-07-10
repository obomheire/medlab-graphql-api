import { InputType, Field } from '@nestjs/graphql';
import { ArrayMinSize, IsArray } from 'class-validator';

@InputType()
export class FileInp {
  @Field(() => String)
  fileName: string;

  @Field(() => String)
  fileId: string;
}

@InputType()
export class AgentsInp {
  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  agentIds: string[];
}

@InputType()
export class KnowledgeBasesInp {
  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  knowledgeBaseIds: string[];
}

@InputType()
export class CreateAgentInp {
  @Field(() => String)
  agentName: string;

  @Field(() => [FileInp])
  @IsArray()
  @ArrayMinSize(1)
  fileIds: FileInp[];

  @Field(() => String)
  firstMessage: string;

  @Field(() => String)
  voiceId: string;

  @Field(() => Boolean, { nullable: true })
  isExaminer2: boolean;
}

@InputType()
export class UpdateAgentInp {
  @Field(() => String)
  agentId: string;

  @Field(() => String)
  voice_id: string;
}
