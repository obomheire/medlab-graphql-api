import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadMessageInput, UpdateMessageInput } from '../dto/assistant.input';
import { ThreadGrpDocument, ThreadGrpEntity } from '../entity/threadGrp.entity';
import { Thread } from '../entity/types.entity';
import { Meta, ThreadGrpRes } from '../types/ai.type';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { createWriteStream, promises as fsPromises } from 'fs';
import { extname, join } from 'path';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import FormData from 'form-data';
import { Readable } from 'stream';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { fileFormat, docsFormat } from 'src/utilities/constant/utils.costant';
import {
  ComponentType,
  PromptType,
  UserThreadType,
} from '../enum/assistantAI.enum';
import {
  assistantFiles,
  assistants,
  fileUrl,
  groqUrl,
  whisperUrl,
} from '../constant/assistant.constant';
import { UserService } from 'src/user/service/user.service';
import { PollInterval } from 'src/utilities/interface/interface';
import { UserDocument } from 'src/user/entity/user.entity';
import { DriveService } from 'src/drive/service/drive.service';
import { isValidJSON } from 'src/utilities/service/helpers.service';
import { QuizAIService } from './ai.quiz.service';
import { eventEmitterType } from 'src/utilities/enum/env.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AsstThreadService {
  private readonly openai: OpenAI;
  private readonly groq: Groq;
  private readonly assistantId: string;
  private pollInterval: Map<string, PollInterval> = new Map();

  constructor(
    private configService: ConfigService,
    @InjectModel(ThreadGrpEntity.name)
    private readonly threadGrpModel: Model<ThreadGrpDocument>,
    private readonly userService: UserService,
    private readonly awsS3Service: AwsS3Service,
    private readonly httpService: HttpService,
    private readonly driveService: DriveService,
    @Inject(forwardRef(() => QuizAIService))
    private readonly quizAIService: QuizAIService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_AI_API_KEY'),
    });

    this.assistantId = assistants.ASSISTANT_ID;
  }

  // Create thread
  async createThreadGrp(
    userId: ObjectId,
    threadId: string,
    dateCreated: string,
    description: string,
    component: ComponentType,
  ): Promise<void> {
    try {
      const payload = {
        userId,
        dateCreated,
        component,
        threads: [
          {
            threadId,
            description,
          },
        ],
      };

      await this.threadGrpModel.create(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Insert thread into thread group
  async insertThreadToThreadGrp(
    userId: ObjectId,
    threadId: string,
    dateCreated: string,
    description: string,
    component: ComponentType,
  ): Promise<void> {
    try {
      // Update thread group if the title (dateCreated) matches
      const updatedThreadGrp = await this.threadGrpModel.findOneAndUpdate(
        { dateCreated, userId, component },
        {
          $push: {
            threads: {
              threadId,
              description,
            },
          },
        },
        { new: true }, // Return the updated document
      );

      // Create a new thread group if the title (dateCreated) does not match
      if (!updatedThreadGrp) {
        await this.createThreadGrp(
          userId,
          threadId,
          dateCreated,
          description,
          component,
        );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all threads by userId
  async getThreadGrp(
    userId: ObjectId,
    component: ComponentType,
  ): Promise<ThreadGrpRes[]> {
    try {
      const threadGrps = await this.threadGrpModel
        .find({ userId, component })
        .sort({ createdAt: -1 })
        .exec(); // Using index

      // Change dateCreated & threads fields to title & data respectively
      const _threadGrps = threadGrps.map((threadGrp) => {
        return {
          threadGrpUUID: threadGrp.threadGrpUUID,
          title: threadGrp.dateCreated,
          data: threadGrp.threads,
          component: threadGrp.component,
        };
      });

      return _threadGrps;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Remove thread from thread group
  async deleteThread(threadId: string): Promise<{ message: string }> {
    try {
      const removeThread = await this.threadGrpModel.findOneAndUpdate(
        { 'threads.threadId': threadId },
        {
          $pull: {
            threads: {
              threadId,
            },
          },
        },
        { new: true }, // Return the updated document
      );

      if (removeThread) {
        await this.openai.beta.threads.del(threadId); // Delete thread from openai
        return { message: 'Thread was successuly removed.' };
      }

      return { message: 'Invalid thread ID.' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update thread in thread group
  async updateThread(threadId: string, description: string): Promise<Thread> {
    try {
      const threadGrp = await this.threadGrpModel.findOne({
        'threads.threadId': threadId,
      });

      const thread = threadGrp.threads.find(
        (thread) => thread.threadId === threadId,
      );

      thread.description = description;

      // Mark threads field as modified
      threadGrp.markModified('threads');
      await threadGrp.save();

      return thread;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete thread group
  async deleteThreadGrp(threadGrpUUID: string): Promise<{ message: string }> {
    try {
      const threadGrp = await this.threadGrpModel.findOne({ threadGrpUUID });

      if (!threadGrp) throw new BadRequestException('Thread group not found.');

      // // Delete all threads from openai concurrently
      await Promise.all(
        threadGrp?.threads.map(
          async (thread) =>
            await this.openai.beta.threads.del(thread?.threadId),
        ),
      );

      // Delete the threadGrp
      await threadGrp.deleteOne();

      return {
        message: 'Thread group and all threads deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete all user thread group
  async deleteAllUserThreads(userId: ObjectId) {
    try {
      const threads = await this.threadGrpModel.deleteMany({ userId });

      return {
        count: threads.deletedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Add message to thread
  async addMessage(
    user: UserDocument,
    { threadId: thread_Id, message }: ThreadMessageInput,
    component: ComponentType,
    userPrompt?: string,
    files?: FileUpload[],
    awsS3Folder?: string,
  ) {
    try {
      let fileIds: string[];
      let imageUrls: string[];
      let transcript: string;
      let fileNames: string[];
      let vs_id: string;
      let _threadId: string;

      if (files?.length) {
        const { secure_urls, _transcript, _fileNames, _fileIds, _vs_id } =
          await this.processUploadFiles(files, message, awsS3Folder); // Upload file

        imageUrls = secure_urls;
        transcript = _transcript;
        fileNames = _fileNames;
        fileIds = _fileIds;
        vs_id = _vs_id;
      }

      if (!thread_Id) {
        const { threadId } = await this.createThread(vs_id); // Create the thread
        _threadId = threadId;
      }

      const { content, title } = this.getContent(
        component,
        transcript,
        message,
        fileIds?.length && fileIds[0],
        fileNames?.length && fileNames[0],
      ); // Get content for prompting

      // Initialize the attachments array
      const attachments: OpenAI.Beta.Threads.Messages.MessageCreateParams.Attachment[] =
        [];

      // Conditionally add data to attachments array
      if (message === PromptType.AI_REWRITE) {
        attachments.push({
          file_id: assistantFiles.CASE_REWRITE_FILE,
          tools: [{ type: 'file_search' }],
        });
      }

      if (component === ComponentType.CASE_RECALL) {
        attachments.push({
          file_id: assistantFiles.CASE_RECALL_FILE,
          tools: [{ type: 'file_search' }],
        });
      }

      if (fileIds?.length) {
        fileIds.forEach((fileId) => {
          attachments.push({
            file_id: fileId,
            tools: [{ type: 'file_search' }],
          });
        });
      }

      const threadId = thread_Id || _threadId;

      const imageUrl = imageUrls && imageUrls[0];

      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content,
        attachments,
        metadata: {
          prompt: component === ComponentType.CASE_PRESENTATION ? message : '',
          fileUrl: imageUrl,
          title,
        },
      });

      const assistMessage: any = await this.runAssistant(
        threadId,
        '',
        user,
        component,
      ); // Run the assistant

      if (!assistMessage)
        throw new BadRequestException('System busy. Please try again later.');

      //  ERROR: lastPlay.getTime is not a funtion if CHAT_SIMULATION is not excluded. Check this later
      if (
        ![
          ComponentType.CHAT_SIMULATION,
          ComponentType.SIMULATION_CONVERSION,
        ].includes(component)
      ) {
        await this.userService.updateUser(user, true); // Update daily & weekly streaks & save user
      }

      const { id: messageId, thread_id, role } = assistMessage;

      const response: any = {
        messageId,
        threadId: thread_id,
        role,
        message: assistMessage?.content[0]?.text?.value,
        metadata: { fileUrl: imageUrl, title },
      };

      // Handle cases where response is not a json for some conponents
      const result = this.handleNonJsonError(response?.message, component);

      const description =
        component === ComponentType.CASE_PRESENTATION
          ? message
            ? this.getDescription(message)
            : 'Case Presentation'
          : result?._description;

      if (
        !thread_Id &&
        ![ComponentType.ASSISTANT_AI, ComponentType.CHAT_SIMULATION].includes(
          component,
        )
      ) {
        await this.insertThreadToThreadGrp(
          user._id,
          _threadId,
          this.getDateCreated(),
          description,
          component,
        );
      }

      if (
        [
          ComponentType.CASE_PRESENTATION,
          ComponentType.QUIZ_AI,
          ComponentType.USER_MEDSYNOPSIS,
          ComponentType.SLIDE_PRESENTATION,
        ].includes(component)
      ) {
        await this.driveService.addDriveData(
          user._id,
          this.getDateCreated(),
          component,
          {
            threadId,
            fileUrl: imageUrl || null,
            userPrompt: userPrompt || null,
            transcript: transcript || null,
            description:
              component === ComponentType.CASE_PRESENTATION
                ? description
                : result?._description || null,
            questions: result?.questions,
          },
        );
      }

      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List messages in a thread
  async listMessagesByThreadId(threadId: string, limit?: number) {
    try {
      const messages = await this.openai.beta.threads.messages.list(threadId, {
        order: 'desc', // or asc
        limit,
      });

      this.transforMessage(messages?.data); // Add fileUrl to the assistant role from the corresponding user role

      return messages?.data?.map((message) => {
        const metadata = message.metadata as Meta;

        return {
          messageId: message.id,
          threadId: message.thread_id,
          role: message.role,
          message:
            message.role === 'user'
              ? metadata.prompt || ''
              : message.content.map((msg: any) => msg.text.value).join(' '),
          metadata: message.metadata,
          fileId: message.attachments?.[0]?.file_id || null,
        };
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create thread
  async createThread(vs_id?: string): Promise<{ threadId: string }> {
    try {
      const payload = {};

      if (vs_id) {
        payload['tool_resources'] = {
          file_search: {
            vector_store_ids: [vs_id],
          },
        };
      }

      const { id } = await this.openai.beta.threads.create(payload); // Create the thread

      return { threadId: id };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Add message to thread
  async updateMessage({ threadId, messageId, message }: UpdateMessageInput) {
    try {
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Start run assistant
  async runAssistant(
    threadId: string,
    assistantId?: string,
    user?: UserDocument,
    component?: ComponentType,
  ) {
    try {
      const run = await this.openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistantId || this.assistantId,
      });

      const totalTokens = run?.usage?.total_tokens;

      //  ERROR: user.markModified is not a funtion if CHAT_SIMULATION is not excluded. Check this later
      if (user && component !== ComponentType.CHAT_SIMULATION) {
        component === ComponentType.SLIDE_PRESENTATION
          ? this.userService.deductCredit(user, totalTokens, true)
          : component === ComponentType.CLINICAL_EXAM
          ? this.userService.deductCredit(user, totalTokens, false, true)
          : this.userService.deductCredit(user, totalTokens); // Update user's used credit
      }

      const messages = await this.openai.beta.threads.messages.list(threadId, {
        run_id: run?.id,
      });

      return messages.data[0];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create vectore store
  async createVSfiles(fileName: string, fileIds: string[]) {
    const vectorStore = await this.openai.beta.vectorStores.create({
      name: fileName,
      file_ids: fileIds,
      metadata: {
        createdAt: new Date(),
      },
    });

    const { id: vs_id }: any = vectorStore;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          // Step 1: Retrieve the vector store status
          const vs_status = await this.openai.beta.vectorStores.retrieve(vs_id);

          const completedFileCount = vs_status.file_counts.completed;
          const totalFileCount = vs_status.file_counts.total;

          // Step 2: Check if the vector store is ready (all files processed)
          if (
            completedFileCount === totalFileCount &&
            vs_status.status === 'completed'
          ) {
            clearInterval(this.pollInterval.get(vs_id)?.interval);

            this.pollInterval.delete(vs_id);

            resolve({ vs_id });
          }
        } catch (error) {
          // Clear interval and reject in case of error
          clearInterval(this.pollInterval.get(vs_id)?.interval);
          this.pollInterval.delete(vs_id);
          reject(error);
        }
      }, 5000); // Poll every 5 seconds

      // Step 3: Store the interval in the Map with the vectorStoreId as the key
      this.pollInterval.set(vs_id, { interval });
    });
  }

  // Create vectore store and add files
  async createVectorStore() {
    try {
      // Create a vector store including our two files.
      const vectorStore = await this.openai.beta.vectorStores.create({
        name: 'Assistant_Files',
        // file_ids: ['file-5vYoWRkbbqELNgxB1ILYMcEA'],
      });

      return { message: vectorStore.id };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List vectore stores
  async listVectorStores(limit: number, after?: string) {
    try {
      const payload = {
        limit,
      };

      if (after) {
        payload['after'] = after;
      }

      const { data }: any = await this.openai.beta.vectorStores.list(payload);

      return { data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List vectore stores files
  async listVSfiles(vectorStorId: string) {
    try {
      const { data }: any = await this.openai.beta.vectorStores.files.list(
        vectorStorId,
      );

      return { data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List vectore stores files
  async deleteVSfiles(vectorStorId: string, fileId: string) {
    try {
      const { data }: any = await this.openai.beta.vectorStores.files.del(
        vectorStorId,
        fileId,
      );

      return { data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List files
  async listFiles() {
    try {
      const { data }: any = await this.openai.files.list();

      return { data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete vectore store
  async deleteVectorStore(vectorStorId: string) {
    try {
      const deletedVectorStore = await this.openai.beta.vectorStores.del(
        vectorStorId,
      );

      return { message: `Deleted vectore store ${deletedVectorStore.id}` };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete file
  async deleteFile(fileId: string) {
    try {
      const deletedFile = await this.openai.files.del(fileId);

      return { message: `Deleted file ${deletedFile.id}` };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get content for prompting
  getContent(
    component: ComponentType,
    transcript?: string,
    message?: string,
    fileId?: string,
    fileName?: string,
  ): { content: string; title: string } {
    let content: string;
    let title: string;

    switch (component) {
      case ComponentType.CASE_PRESENTATION:
        content = transcript
          ? `Organize the transcript in paragraphs where applicable. Here is the transcript: ${transcript}. 
          Strictly avoid adding any additional comments before or after your organized transcript.`
          : message === PromptType.AI_REWRITE
          ? `I have provided a file name: case_resentation_rewrite_format_and_template.pdf that contains a 
          specific format I want you to follow. Please rewrite the previous content according to the format
          in the uploaded file. Please ignore any sections that are indicated in the file but not provided 
          in the content. Ensure that the structure and headings from the file are maintained in your response. Use international units for values. You may put US units in bracket if different. For instance, 37oC (98oF)`
          : message === PromptType.AI_FEEDBACK
          ? `Please review the content for clarity, organization, completeness, and relevance, and provide suggestions for improvement. This presentation is intended for a medical professional audience, so complex medical terminology is appropriate and does not require explanation. Use international units for values. You may put US units in bracket if different. For instance, 37oC (98oF)`
          : fileId
          ? `I have uploaded a file named: ${fileName}. 1. Use the content of the file. 
          2. Process it using the prompt: ${message}. 
          3. When responding, ensure that your answer is well-structured & organized incorporating key details from the content. 
          4. Provide a concise yet thorough answer that directly addresses the prompt.
          5. Include the Extracted content as part of your response.
          6. Use international units for values. You may put US units in bracket if different. For instance, 37oC (98oF)`
          : message;

        title = transcript
          ? 'AI Transcript'
          : message === PromptType.AI_REWRITE
          ? 'AI Rewrite'
          : message === PromptType.AI_FEEDBACK
          ? 'AI Feedback'
          : '';
        break;

      // Add more cases here for different ComponentTypes if needed
      case ComponentType.MEDSYNOPSIS:
      case ComponentType.USER_MEDSYNOPSIS:
      case ComponentType.EXAMPREP:
      case ComponentType.CASE_RECALL:
      case ComponentType.QUIZ_AI:
      case ComponentType.DX_QUEST:
      case ComponentType.BROAD_SCOPE_QUIZ:
      case ComponentType.MED_MATCH:
      case ComponentType.PROBLEM_LIST_EVALUATION:
      case ComponentType.USMLE_STEP1:
      case ComponentType.USMLE_STEP2:
      case ComponentType.BASIC_SCIENCE:
      case ComponentType.GENERAL_TRIVIA:
      case ComponentType.MEDICAL_TRIVIA:
      case ComponentType.ASSISTANT_AI:
      case ComponentType.PLAB1:
      case ComponentType.AMC1:
      case ComponentType.RACP1:
      case ComponentType.RACGP_AKT:
      case ComponentType.RACGP_KFP:
      case ComponentType.NCLEX_RN:
      case ComponentType.NCLEX_PN:
      case ComponentType.CLINICAL_SCIENCE:
      case ComponentType.SLIDE_PRESENTATION:
      case ComponentType.GROUP_QUESTIONS:
      case ComponentType.OUTLINE_TO_JSON:
      case ComponentType.EVENT_TEMPLATE:
      case ComponentType.CHAT_SIMULATION:
      case ComponentType.SIMULATION_CONVERSION:
      case ComponentType.ENGAGEMENT:
        content = message;
        break;

      default:
        content = 'Invalid component type';
        break;
    }

    return { content, title };
  }

  async transcribeFileOpenAI(file: FileUpload): Promise<string> {
    try {
      const { createReadStream, filename, mimetype } = file;
      const stream = createReadStream();

      const formData = new FormData();
      formData.append('file', stream, {
        filename,
        contentType: mimetype,
      });
      formData.append('model', 'whisper-1');

      const {
        data: { text },
      } = await firstValueFrom(
        this.httpService.post(whisperUrl, formData, {
          headers: {
            Authorization: `Bearer ${this.openai.apiKey}`,
          },
        }),
      );

      return text;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Transcribe file using Groq AI
  async transcribeFileGroqAI(
    file: FileUpload | Express.Multer.File,
  ): Promise<string> {
    try {
      let filename: string;
      let mimetype: string;
      let stream: Readable;

      if ('originalname' in file) {
        // REST Upload (Multer)
        filename = file.originalname;
        mimetype = file.mimetype;
        const uploadedFile = file.buffer;

        stream = Readable.from(uploadedFile); // Convert Buffer to Readable stream
      } else {
        // GraphQL Upload (FileUpload)
        const uploadedFile = await file;
        filename = uploadedFile.filename;
        mimetype = uploadedFile.mimetype;
        stream = uploadedFile.createReadStream();
      }

      // Get file extension
      const fileExtension = extname(filename).toLowerCase();
      if (!fileFormat.includes(fileExtension)) {
        throw new BadRequestException('Invalid file format.');
      }

      // Prepare form data for API request
      const formData = new FormData();
      formData.append('file', stream, { filename, contentType: mimetype });
      formData.append('model', 'whisper-large-v3');

      // Send request to Groq AI
      const {
        data: { text },
      } = await firstValueFrom(
        this.httpService.post(groqUrl, formData, {
          headers: { Authorization: `Bearer ${this.groq.apiKey}` },
        }),
      );

      return text;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upload files
  async processUploadFiles(
    files: FileUpload[],
    message: string,
    awsS3Folder?: string,
  ) {
    try {
      const _fileIds = [];
      const _fileNames = [];
      let _transcript: string;
      let _vs_id: string;

      const secure_urls = await Promise.all(
        files.map(async (_file) => {
          const file = await _file; // Await the promise to get the file object
          const fileExtension = extname(file.filename).toLowerCase(); // Get file extension

          const isAudio = fileFormat.includes(fileExtension);

          // Check if the file is in the accepted file format
          if (!isAudio && !docsFormat.includes(fileExtension))
            throw new BadRequestException('Invalid file format.');

          if (!isAudio && !message)
            throw new BadRequestException(
              'Please provide a prompt specifying the intended action for the uploaded file.',
            );

          if (isAudio) _transcript = await this.transcribeFileGroqAI(file); // Get the audio transcription

          if (!isAudio) _fileNames.unshift(file.filename);

          const { createReadStream } = file;
          const stream = createReadStream();
          let _secure_url: string;

          // Upload file to S3 if awsS3Folder is provided
          if (awsS3Folder) {
            const { secure_url } = await this.awsS3Service.uploadFile(
              awsS3Folder,
              stream,
              fileExtension,
            ); // Upload file to S3

            _secure_url = secure_url;
          }

          if (!isAudio) {
            const { file_id } = await this.uploadFileToOpenai(file); // Upload file to OpenAI

            _fileIds.unshift(file_id);
          }

          // Return result for each file
          return _secure_url;
        }),
      );

      if (_fileIds?.length) {
        const { vs_id }: any = await this.createVSfiles(
          'multiFileVstore',
          _fileIds,
        );

        _vs_id = vs_id;
      }

      return { secure_urls, _fileIds, _vs_id, _transcript, _fileNames };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upload file
  async uploadFileToOpenai(file: FileUpload): Promise<{ file_id: string }> {
    try {
      const { createReadStream, filename, mimetype } = await file;
      const stream = createReadStream();
      const formData = new FormData();

      formData.append('file', stream, {
        filename,
        contentType: mimetype,
      });

      formData.append('purpose', 'assistants');

      const {
        data: { id: file_id },
      } = await firstValueFrom(
        this.httpService.post(fileUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.openai.apiKey}`,
          },
        }),
      );

      return { file_id };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Upload file to OpenAI
  async uploadTxtToOpenai(file: string): Promise<{ file_id: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file, {
        filename: 'transcript.txt',
        contentType: 'text/plain',
      });
      formData.append('purpose', 'assistants');

      const {
        data: { id: file_id },
      } = await firstValueFrom(
        this.httpService.post(fileUrl, formData, {
          headers: {
            Authorization: `Bearer ${this.openai.apiKey}`,
          },
        }),
      );

      return { file_id };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // vector store and upload files
  async processVSFiles(files: FileUpload[]) {
    try {
      let _vs_id: string;

      const fileIds = await Promise.all(
        files.map(async (_file) => {
          const file = await _file; // Await the promise to get the file object
          const { file_id } = await this.uploadFileToOpenai(file); // Upload file to OpenAI

          return file_id;
        }),
      );

      if (fileIds?.length) {
        const { vs_id }: any = await this.createVSfiles(
          'Chat Assistant Store',
          fileIds,
        );

        _vs_id = vs_id;
      }

      return { fileIds, vs_id: _vs_id };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  transforMessage(messages: any) {
    messages.forEach((message: any, index: number) => {
      // Check if the current message is from an 'assistant' and the next one is from a 'user'
      if (message.role === 'assistant' && index < messages.length - 1) {
        const nextMessage = messages[index + 1];

        if (nextMessage.role === 'user') {
          // Assign the next message's fileUrl to the current assistant message
          message.metadata.fileUrl = nextMessage?.metadata?.fileUrl;
          message.metadata.title = nextMessage?.metadata?.title;
        }
      }
    });
  }

  // Testing save file to the root directory
  async saveFile(file: FileUpload) {
    try {
      const { createReadStream, filename } = file;
      const uploadDir = join(process.cwd(), 'uploaded-file');

      // Ensure the directory exists
      await fsPromises.mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, filename);

      new Promise((resolve, reject) => {
        const stream = createReadStream();
        const writeStream = createWriteStream(filePath);

        stream
          .pipe(writeStream)
          .on('finish', () => resolve({ path: filePath }))
          .on('error', (error: any) => {
            reject(new BadRequestException('File upload failed'));
          });
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Handle non json error
  handleNonJsonError(message: string, component: ComponentType) {
    if (
      ![
        ComponentType.CASE_PRESENTATION,
        ComponentType.ASSISTANT_AI,
        ComponentType.SLIDE_PRESENTATION,
      ].includes(component)
    ) {
      if (!isValidJSON(message)) {
        if (
          ![ComponentType.QUIZ_AI, ComponentType.CASE_RECALL].includes(
            component,
          )
        )
          throw new BadRequestException(message);

        throw new BadRequestException('Sytem busy, please try again later!');
      }

      const _response = JSON.parse(message); // Deserialize the aiMessage

      return { _description: _response?.description, questions: message };
    }
  }

  // Get description
  getDescription(message: string): string {
    return message
      .split(' ')
      .slice(0, 12)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Get date created
  getDateCreated() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');

    return `${day} ${month} ${year}`;
  }

  async getValidateJSON(message: string): Promise<any> {
    try {
      const chat = [
        {
          role: 'user',
          content: `The following string contains invalid JSON. Please parse it and return a corrected, valid JSON representation while maintaining the original structure and content as closely as possible: ${message}. Ensure that you return the output strictly in JSON format without using code block formatting and without any additional comments before or after the JSON object`,
        },
      ];

      const systemMessage =
        'You are a helpful assistant specializing in JSON validation and correction. Your task is to analyze provided JSON strings, identify any errors or invalid structures, and return a corrected, valid JSON object while preserving the original content and intent as closely as possible.';

      const newMessage = await this.quizAIService.chatCompletion(
        chat as any,
        systemMessage,
      );

      if (!isValidJSON(newMessage))
        throw new BadRequestException(
          'An error occurred while generating the response.',
        );

      return JSON.parse(newMessage); // Deserialize the aiMessage
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get or create user'thread
  async getOrCreateThread(
    user: UserDocument,
    threadKey: UserThreadType,
    vs_id?: string,
  ): Promise<string> {
    try {
      let threadId: string;

      if (!user.threads?.[threadKey]) {
        const { threadId: thread_id } = await this.createThread(vs_id);

        user.threads[threadKey] = thread_id;

        // Mark threads field as modified
        user.markModified('threads');
        await user.save();

        threadId = thread_id;
      } else {
        threadId = user.threads[threadKey];
      }

      return threadId;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
