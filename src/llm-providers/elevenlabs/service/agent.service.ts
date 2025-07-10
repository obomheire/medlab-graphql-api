import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { CreateAgentInp } from 'src/llm-providers/elevenlabs/dto/elevenlabs.dto';
import {
  femaleVoiceId,
  goalPrompt,
  maleVoiceId,
  systemPrompt,
} from '../constatnt/elevenlabs.constant';

@Injectable()
export class AgentService {
  private readonly apiUrl = 'https://api.elevenlabs.io/v1';
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('11LABS_API_KEY');
    this.webhookSecret = this.configService.get<string>(
      '11LABS_WEBHOOK_SECRET',
    );
  }

  // Create agent
  async createAgent(createAgentInp: CreateAgentInp) {
    try {
      const { agentName, fileIds, isExaminer2, firstMessage, voiceId } =
        createAgentInp;

      const agent = await this._createAgent(
        isExaminer2 ? systemPrompt.examiner2 : systemPrompt.examiner1,
        agentName,
        voiceId,
        fileIds,
        firstMessage,
      );

      return agent;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create agent
  async _createAgent(
    prompt: string,
    agentName: string,
    voice_id: string,
    files: { fileName: string; fileId: string }[],
    first_message: string,
    isExaminer2 = false,
  ) {
    try {
      const knowledge_base = files.map((file) => ({
        type: 'file',
        name: file.fileName,
        id: file.fileId,
        usage_mode: 'auto',
      }));

      const conversation_goal_prompt = isExaminer2
        ? goalPrompt.examiner2
        : goalPrompt.examiner1;

      const payload = {
        name: agentName,
        conversation_config: {
          asr: {
            user_input_audio_format: 'pcm_16000',
          },
          turn: {
            turn_timeout: -1,
            mode: 'turn',
          },
          tts: {
            model_id: 'eleven_flash_v2',
            voice_id,
            agent_output_audio_format: 'pcm_16000',
          },
          conversation: {
            max_duration_seconds: 3600, // 60 minutes
            client_events: [
              'audio',
              'interruption',
              'agent_response',
              'user_transcript',
              'agent_response_correction',
            ],
          },
          agent: {
            first_message,
            prompt: {
              prompt,
              llm: 'gpt-4o-mini',
              temperature: 0.5,
              knowledge_base,
              ignore_default_personality: false,
              rag: {
                embedding_model: 'e5_mistral_7b_instruct',
              },
            },
          },
        },
        platform_settings: {
          evaluation: {
            criteria: [
              {
                id: uuidv4(),
                name: 'conversation_completion',
                type: 'prompt',
                conversation_goal_prompt,
                use_knowledge_base: true,
              },
            ],
          },
        },
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/convai/agents/create`, payload, {
          headers: { 'xi-api-key': this.apiKey },
        }),
      );

      return { data: response.data };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }

  // Create agent
  async updateAgent(agentId: string, voice_id: string) {
    try {
      const payload = {
        conversation_config: {
          tts: {
            voice_id,
          },
        },
      };

      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.apiUrl}/convai/agents/${agentId}`,
          payload,
          {
            headers: { 'xi-api-key': this.apiKey },
          },
        ),
      );

      return { data: response.data };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }

  // Delete agents
  async deleteAgents(agentIds: string[]) {
    try {
      const deleteRequests = agentIds.map((agentId) =>
        firstValueFrom(
          this.httpService.delete(`${this.apiUrl}/convai/agents/${agentId}`, {
            headers: { 'xi-api-key': this.apiKey },
          }),
        ),
      );

      const responses = await Promise.all(deleteRequests);

      return { data: responses.map((response) => response.status) };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }

  // Delete knowledge base
  async deleteKnowledgeBases(knowledgeBaseIds: string[]) {
    try {
      const deleteRequests = knowledgeBaseIds.map((knowledgeBaseId) =>
        firstValueFrom(
          this.httpService.delete(
            `${this.apiUrl}/convai/knowledge-base/${knowledgeBaseId}`,
            {
              headers: { 'xi-api-key': this.apiKey },
            },
          ),
        ),
      );

      const responses = await Promise.all(deleteRequests);

      return { data: responses.map((response) => response.status) };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }

  // Retrieve agent
  async retrieveAgent(agentId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/convai/agents/${agentId}`, {
          headers: { 'xi-api-key': this.apiKey },
        }),
      );

      return { data: response?.data };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }

  // Retrieve conversation
  async retrieveConversation(conversationId: string) {
    try {
      // atatus: processing, done, failed
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/convai/conversations/${conversationId}`,
          {
            headers: { 'xi-api-key': this.apiKey },
          },
        ),
      );

      return { data: response?.data };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }

  // Upload file to ElevenLabs
  async uploadFileToElevenLabs(fileName: string, transcript = '', url = '') {
    try {
      const form = new FormData();
      form.append('name', fileName);
      form.append('url', url); // Use provided URL if available

      if (!url && transcript) {
        const buffer = Buffer.from(transcript, 'utf-8');
        form.append('file', buffer, {
          filename: `${fileName}.txt`,
          contentType: 'text/plain',
        });
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/convai/knowledge-base`, form, {
          headers: {
            'xi-api-key': this.apiKey,
            ...form.getHeaders(),
          },
        }),
      );

      return { docsId: response.data?.id };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }

  // Create knowledge base
  async createKnowledgeBase(
    conversationId: string,
    examinerFileUrl: string,
    transcript?: string,
  ) {
    try {
      let transcriptDocsId = '';

      if (transcript) {
        // Upload transcript to as a knowledge base for the examiners
        const { docsId: _transcriptDocsId } = await this.uploadFileToElevenLabs(
          `${conversationId}-conversation-examiners_file`,
          transcript,
        );

        transcriptDocsId = _transcriptDocsId;
      }

      // Upload case details to as a knowledge base for the examiner
      const { docsId: caseDocsId } = await this.uploadFileToElevenLabs(
        `${conversationId}-case-details-examiner-1-file`,
        '',
        examinerFileUrl,
      );

      return { transcriptDocsId, caseDocsId };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }

  // Get random voice id
  private getVoiceId(gender?: string) {
    let randomVoice: string;

    switch (gender) {
      case 'female':
        randomVoice =
          femaleVoiceId[Math.floor(Math.random() * femaleVoiceId.length)];
        break;
      case 'male':
      default:
        randomVoice =
          maleVoiceId[Math.floor(Math.random() * maleVoiceId.length)];
        break;
    }

    return randomVoice;
  }

  // Retrieve models
  async retrieveModels() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/models`, {
          headers: { 'xi-api-key': this.apiKey },
        }),
      );

      return { data: response?.data };
    } catch (error) {
      throw new BadRequestException(error?.response?.data || error.message);
    }
  }
}
