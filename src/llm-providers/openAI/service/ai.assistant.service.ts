import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import OpenAI from 'openai';
import { CreateAsstRes } from '../types/ai.type';
import { MessageRes } from 'src/auth/types/auth.types';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { AsstThreadService } from './ai.thread.service';
import { assistants } from '../constant/assistant.constant';
import { SlideAssInput } from '../dto/assistant.input';
import { isValidJSON } from 'src/utilities/service/helpers.service';
import { UserDocument } from 'src/user/entity/user.entity';
import { SlideAssPromptType } from 'src/presentation/enum/presentation.enum';
import { ComponentType, UserThreadType } from '../enum/assistantAI.enum';
import { UserService } from 'src/user/service/user.service';

@Injectable()
export class AIasistantService {
  private readonly openai: OpenAI;
  private readonly assistantId: string;

  constructor(
    private configService: ConfigService,
    private readonly asstThreadService: AsstThreadService,
    private userService: UserService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    this.assistantId = assistants.CHAT_ASSISTANT_ID;
  }

  // Create AI assistant
  async createAssistant(): Promise<CreateAsstRes> {
    try {
      const assistant = await this.openai.beta.assistants.create({
        name: 'RACP Exam AI',
        instructions: `
      You are an AI designed to simulate an RACP exam scenario. Your role consists of three phases:
      1. **Diagnostic Assistance**: Assist the doctor in diagnosing the patient based on the given medical case. Provide relevant information and guidance while ensuring the doctor leads the diagnostic process.
      2. **Examiner Interaction**: After the diagnostic phase, switch roles to an examiner. Ask the doctor relevant clinical questions based on the previous conversation.
      3. **Performance Evaluation**: Score the doctor's responses based on clinical accuracy, diagnostic reasoning, and communication skills. Provide constructive feedback at the end.
      
      Ensure that the experience is realistic, professional, and aligns with medical examination standards.`,
        // tools: [{ type: 'code_interpreter' }],
        tools: [{ type: 'file_search' }],
        // tools: [
        //   { type: 'function', function: { name: 'demo', description: 'demo' } },
        // ],
        // response_format: { type: 'json_object' }, // Only where tools is type function
        // model: 'gpt-4o-mini',
        model: 'o3-mini',
      });

      return { assistantId: assistant.id };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List all assistants
  async listAssistants(): Promise<OpenAI.Beta.Assistants.Assistant[]> {
    try {
      const assistants = await this.openai.beta.assistants.list({
        order: 'desc',
        limit: 20,
      });

      return assistants.data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // retrieve assistant
  async retrieveAssistant(
    assistantId: string,
  ): Promise<OpenAI.Beta.Assistants.Assistant> {
    try {
      const assistants = await this.openai.beta.assistants.retrieve(
        assistantId,
      );

      return assistants;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create AI assistant
  async updateAssistant(
    assistantId: string,
  ): Promise<OpenAI.Beta.Assistants.Assistant> {
    try {
      const updatedAssistant = await this.openai.beta.assistants.update(
        assistantId,
        {
          temperature: 0.4,
          // response_format: { type: 'json_object' },
          // tools: [{ type: 'file_search' }],
          // tools: [
          //   {
          //     type: 'function',
          //     function: { description: 'demo', name: 'demo' },
          //   },
          // ],
          // model: 'gpt-4o-mini',
          // name: 'Clinical Exam AI',
          //     instructions: `You are an AI designed to simulate an RACP exam scenario. Your role consists of four phases:

          // 1. **Patient Simulation**: Act as a patient presenting with symptoms in a realistic clinical scenario. Provide appropriate responses based on the patient's condition while allowing the doctor to gather relevant clinical information through questioning.

          // 2. **Examiner Interaction**: Transition into the examiner role after the patient consultation. Listen carefully to the doctor's presentation of their findings and diagnosis. Then, ask relevant clinical questions to assess their reasoning, decision-making, and communication skills.

          // 3. **Performance Evaluation**: Score the doctor's responses based on clinical accuracy, diagnostic reasoning, and communication skills. Provide constructive feedback at the end.

          // 4. **Diagnostic Assistance**: Assist the doctor in diagnosing the patient based on the given medical case. Provide relevant information and guidance while ensuring the doctor leads the diagnostic process.`,
          //     // tool_resources: {
          //     //   file_search: { vector_store_ids: ['vs_9pRPz8L7vCOKS8rgDLXkpIaM'] },
          //     // },
        },
      );

      return updatedAssistant;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete AI assistant
  async deleteAssistant(assistantId: string): Promise<MessageRes> {
    try {
      await this.openai.beta.assistants.del(assistantId);

      return { message: 'Asssiatant successfuly deleted.' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Assistant AI
  async slideAssistantAI(user: UserDocument, slideAssInput: SlideAssInput) {
    try {
      const { threadId, prompt: userPrompt, promptType } = slideAssInput;

      const prompt =
        promptType === SlideAssPromptType.PRESENTATION_SUBTITLE
          ? this.getPrompt(userPrompt, 'subtitle')
          : promptType === SlideAssPromptType.PRESENTATION_TITLE
          ? this.getPrompt(userPrompt, 'titles')
          : userPrompt;

      const result = await this.asstThreadService.addMessage(
        user,
        { threadId, message: prompt },
        ComponentType.ASSISTANT_AI,
      );

      if (
        promptType === SlideAssPromptType.PRESENTATION_SUBTITLE ||
        promptType === SlideAssPromptType.PRESENTATION_TITLE
      ) {
        if (!isValidJSON(result?.message))
          throw new BadRequestException(result.message);

        const message = JSON.parse(result.message);

        return { ...result, data: message };
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  // Assistant AI
  async slideMedScrollAssistantAI(slideAssInput: SlideAssInput) {
    try {
      const { threadId, prompt: userPrompt, promptType, title } = slideAssInput;

      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );

      const user = await this.userService.getUserByObjectId(medScrollId);

      if (promptType !== SlideAssPromptType.PRESENTATION_TITLE && !title) {
        throw new BadRequestException(
          'Please provide a title for the presentation.',
        );
      }

      let prompt =
        promptType === SlideAssPromptType.PRESENTATION_SUBTITLE
          ? this.getPrompt(userPrompt, 'subtitle')
          : promptType === SlideAssPromptType.PRESENTATION_TITLE
          ? this.getPrompt(userPrompt, 'titles')
          : promptType === SlideAssPromptType.PRESENTATION_AUDIENCE
          ? this.getPrompt(userPrompt, 'audience')
          : promptType === SlideAssPromptType.PRESENTATION_GOAL
          ? this.getPrompt(userPrompt, 'goal')
          : promptType === SlideAssPromptType.PRESENTATION_OUTLINE
          ? this.getPrompt(userPrompt, 'outline')
          : promptType === SlideAssPromptType.PRESENTATION_DESCRIPTION
          ? this.getPrompt(userPrompt, 'description')
          : userPrompt;

      if (
        promptType === SlideAssPromptType.PRESENTATION_OUTLINE ||
        promptType === SlideAssPromptType.PRESENTATION_SUBTITLE ||
        promptType === SlideAssPromptType.PRESENTATION_GOAL ||
        promptType === SlideAssPromptType.PRESENTATION_AUDIENCE ||
        promptType === SlideAssPromptType.PRESENTATION_DESCRIPTION
      ) {
        prompt += `\n\nPresentation Title: ${title} \n Strictly make sure the content generated is based on the title provided.`;
      }

      const result = await this.asstThreadService.addMessage(
        user,
        { threadId, message: prompt },
        ComponentType.ASSISTANT_AI,
      );

      if (
        promptType === SlideAssPromptType.PRESENTATION_SUBTITLE ||
        promptType === SlideAssPromptType.PRESENTATION_TITLE ||
        promptType === SlideAssPromptType.PRESENTATION_AUDIENCE ||
        promptType === SlideAssPromptType.PRESENTATION_GOAL ||
        promptType === SlideAssPromptType.PRESENTATION_OUTLINE ||
        promptType === SlideAssPromptType.PRESENTATION_DESCRIPTION
      ) {
        if (!isValidJSON(result?.message))
          throw new BadRequestException(result.message);

        const message = JSON.parse(result.message);

        return { ...result, data: message };
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create assistant vector store and upload files
  async createAndAddFillesToVS(files: FileUpload[]) {
    try {
      return await this.asstThreadService.processVSFiles(files);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Chat assistant AI
  async chatAssistantAI(user: UserDocument, propmt: string) {
    try {
      const threadId = await this.asstThreadService.getOrCreateThread(
        user,
        UserThreadType.CHAT_ASSISTANT,
      );

      // Create message
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: `${propmt}. Please provide a clear step-by-step guide without including any citation markers such as 【4:0†source】 or similar in the response.`,
      });

      // Create a run
      const message: any = await this.asstThreadService.runAssistant(
        threadId,
        this.assistantId,
      );

      if (!message)
        throw new BadRequestException('System busy. Please try again later.');

      const { id: messageId, role } = message;

      return {
        messageId,
        threadId,
        role,
        message: message?.content[0]?.text?.value,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Generate images
  async generateImage(prompt: string, imageNo = 1) {
    try {
      const { data } = await this.openai.images.generate({
        prompt,
        model: 'dall-e-3', // Explicitly using DALL·E 3
        n: imageNo,
        size: '1024x1024',
        response_format: 'url',
        // model: 'dall-e-2', // dall-e-3 or dall-e-2. Defaults to dall-e-2
        // prompt,
        // response_format: 'url', // b64_json or url. Defaults to url
        // size: '256x256', // Defaults to 1024x1024
        // n: imageNo, // Defaults to 1
      });

      return { data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get prompt for assistant AI
  getPrompt(userPrompt: string, prompType: string, title?: string): string {
    if (prompType === 'outline') {
      return `${userPrompt}.
          Ensure that:
          1. The array contain 5 different outlines that the user can choose from.
          2. Each Markdown should have all of the sections wrapped in it (e.g., \`## Introduction\`) followed by 1–3 concise bullet points or short paragraphs explaining that section.
          3. Use **markdown formatting** to structure the outline (headers, bullets, etc.).
          4. Return the output **strictly as an array of markdown strings**. Do not include any code block formatting (no triple backticks) or comments before or after the array.
          5. The final output should be in the form:
          [
            "## Section 1\\n- Point 1\\n- Point 2 ...
            ## Section 2\\n- Point 1\\n- Point 2 ...
            ## Section 3\\n- Point 1\\n- Point 2 ...
            ## Section 4\\n- Point 1\\n- Point 2 ...
            ## Section 5\\n- Point 1\\n- Point 2 ...
            etc.
            ",
            "## Section 1\\n- Point 1\\n- Point 2 ... 
            ## Section 2\\n- Point 1\\n- Point 2 ...
            ## Section 3\\n- Point 1\\n- Point 2 ...
            ## Section 4\\n- Point 1\\n- Point 2 ...
            ## Section 5\\n- Point 1\\n- Point 2 ...
            etc.
            ",
            ...]`;
    } else {
      return `${userPrompt}.
        Ensure that:
        1. The array contain 5 ${prompType}.
        2. Adhere strictly to the response format array of strings. Return the output strictly in array of strings as follows without using code block formatting and without any additional comments before or after the array:
            [strings of ${prompType}]
              `;
    }
  }
}
