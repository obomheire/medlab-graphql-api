import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { DataRes } from 'src/stripe/types/stripe.types';
import {
  AgentsInp,
  CreateAgentInp,
  KnowledgeBasesInp,
  UpdateAgentInp,
} from 'src/llm-providers/elevenlabs/dto/elevenlabs.dto';
import { AgentService } from '../service/agent.service';
import { ElevenLabsService } from '../service/elevenlabs.service';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class AgentResolver {
  constructor(
    private readonly agentService: AgentService,
    private readonly elevenLabsService: ElevenLabsService,
  ) {}

  // Create agent
  @Mutation(() => DataRes)
  async createAgent(@Args('createAgentInp') createAgentInp: CreateAgentInp) {
    return await this.agentService.createAgent(createAgentInp);
  }

  // Create agent
  @Mutation(() => DataRes)
  async updateAgent(
    @Args('updateAgentInp') { agentId, voice_id }: UpdateAgentInp,
  ) {
    return await this.agentService.updateAgent(agentId, voice_id);
  }

  // Retrieve conversation
  @Query(() => DataRes)
  async retrieveAgent(@Args('agentId') agentId: string) {
    return await this.agentService.retrieveAgent(agentId);
  }

  // Retrieve conversation
  @Query(() => DataRes)
  async retrieveConversation(@Args('conversationId') conversationId: string) {
    return await this.agentService.retrieveConversation(conversationId);
  }

  // Delete agents
  @Mutation(() => DataRes)
  async deleteAgents(@Args('deleteAgentsInp') { agentIds }: AgentsInp) {
    return await this.agentService.deleteAgents(agentIds);
  }

  // Delete knowledge base
  @Mutation(() => DataRes)
  async deleteKnowledgeBases(
    @Args('knowledgeBasesInp')
    { knowledgeBaseIds }: KnowledgeBasesInp,
  ) {
    return await this.agentService.deleteKnowledgeBases(knowledgeBaseIds);
  }

  // Retrieve models
  @Query(() => DataRes)
  async retrieveModels() {
    return await this.agentService.retrieveModels();
  }

  // // Create voice (TESTING ONLY)
  // @Mutation(() => DataRes)
  // async createTextToSpeech() {
  //   return await this.elevenLabsService.createTextToSpeech();
  // }
}
