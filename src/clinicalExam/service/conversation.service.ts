import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConversationEntity } from '../entity/conversation.entity';
import { UserDocument } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import {
  EndExaminer2Inp,
  SubmitLCGradeInp,
  SubmitSCGradeInp,
} from '../dto/conversation.dto';
import { PractCaseCatService } from './practCaseCat.service';
import { CaseType } from '../enum/clinicalExam.enum';
import { PractCaseCatEntity } from '../entity/practCaseCat.entity';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { UserService } from 'src/user/service/user.service';
import { ObjectId } from 'mongodb';
import { AgentService } from 'src/llm-providers/elevenlabs/service/agent.service';
@Injectable()
export class ConversationService {
  private readonly apiUrl = 'https://api.elevenlabs.io/v1/convai';
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor(
    @InjectModel(ConversationEntity.name)
    private readonly conversationModel: Model<ConversationEntity>,
    private configService: ConfigService,
    private readonly practCaseCatService: PractCaseCatService,
    private readonly asstThreadService: AsstThreadService,
    private readonly userService: UserService,
    private readonly agentService: AgentService,
  ) {
    this.apiKey = this.configService.get<string>('11LABS_API_KEY');
    this.webhookSecret = this.configService.get<string>(
      '11LABS_WEBHOOK_SECRET',
    );
  }

  // Create agent
  async createConversation(payload: ConversationEntity) {
    try {
      return await this.conversationModel.create(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get conversation
  async getConversation(conversationUUID: string) {
    try {
      const conversation = await this.conversationModel
        .findOne({
          conversationUUID,
        })
        .populate<{ practCaseCatId: PractCaseCatEntity }>('practCaseCatId');

      if (!conversation) {
        throw new BadRequestException('Conversation not found');
      }

      return conversation;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get conversation by practCaseCatUUID
  async getMyConvByCaseCatUUID(
    userId: ObjectId,
    practCaseCatUUID: string,
    page: number,
    limit: number,
  ) {
    try {
      const conversations = await this.conversationModel.aggregate([
        {
          $lookup: {
            from: 'practcasecatentities', // Collection name (should match your actual collection name)
            localField: 'practCaseCatId',
            foreignField: '_id',
            as: 'practCaseCatId',
          },
        },
        { $unwind: '$practCaseCatId' }, // Flatten the lookup array
        {
          $match: {
            userId,
            'practCaseCatId.practCaseCatUUID': practCaseCatUUID,
          },
        },
        {
          $sort: {
            createdAt: -1, // Descending order
          },
        },
        { $skip: (page - 1) * limit }, // Pagination skip
        { $limit: limit }, // Pagination limit
      ]);

      const count = conversations.length;

      const totalPages = Math.ceil(count / limit);

      const pagination = {
        totalRecords: count,
        totalPages,
        pageSize: conversations.length,
        prevPage: page > 1 ? page - 1 : null,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
      };

      return { conversations, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Submit presentation
  async submitPresentationLC(
    user: UserDocument,
    practCaseCatUUID: string,
    patientAgentId: string,
    file: FileUpload,
  ) {
    try {
      const { _id, caseType } = await this.practCaseCatService.getPractCaseCat(
        practCaseCatUUID,
      );

      if (caseType !== CaseType.LONG_CASE) {
        throw new BadRequestException('Invalid practCaseCatUUID');
      }

      const transcript = await this.asstThreadService.transcribeFileGroqAI(
        file,
      );

      const _transcript = `CANDIDATE PRESENTATION: \n${transcript}`;

      // Create conversation document
      const document: ConversationEntity = {
        userId: user._id,
        practCaseCatId: _id,
        transcript: _transcript,
        patientAgentId,
      };

      const { conversationUUID } = await this.createConversation(document); // Create conversation

      return { conversationUUID };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async endExaminer2Interaction(
    user: UserDocument,
    endExaminer2Inp: EndExaminer2Inp,
  ) {
    try {
      const { conversationUUID, patientConversId, examiners, note } =
        endExaminer2Inp;

      // Retrieve main conversation
      const conversation = await this.getConversation(conversationUUID);

      // Fetch all required conversations in parallel
      const [patientRes, exam1Res, exam2Res] = await Promise.all([
        this.agentService.retrieveConversation(patientConversId),
        this.agentService.retrieveConversation(
          examiners.examiner1.conversationId,
        ),
        this.agentService.retrieveConversation(
          examiners.examiner2.conversationId,
        ),
      ]);

      // Get total token cost
      const totalTokens: number =
        (patientRes?.data?.metadata?.cost || 0) +
        (exam1Res?.data?.metadata?.cost || 0) +
        (exam2Res?.data?.metadata?.cost || 0);

      this.userService.deductCredit(user, totalTokens, false, true); // Update user's used credit

      // Helper to format transcript
      const formatTranscript = (title: string, transcript: any[]) =>
        `${title}:\n${transcript
          .map(({ role, message }) => `${role}: ${message}`)
          .join('\n')}`;

      const exam1Transcript = formatTranscript(
        'EXAMINER 1 TRANSCRIPT',
        exam1Res?.data?.transcript,
      );

      const exam2Transcript = formatTranscript(
        'EXAMINER 2 TRANSCRIPT',
        exam2Res?.data?.transcript,
      );

      // Append to existing transcript
      const fullTranscript = `${conversation.transcript}\n\n${exam1Transcript}\n\n${exam2Transcript}`;

      // Update and save conversation
      Object.assign(conversation, {
        examiners,
        note,
        transcript: fullTranscript,
      });

      await conversation.save();

      return { message: 'Success' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Submit long case self grading
  async submitLCSelfGrade(submitLCGradeInp: SubmitLCGradeInp) {
    try {
      const { conversationUUID, comment, ...rest } = submitLCGradeInp;

      const conversation = await this.getConversation(conversationUUID);

      if (conversation.practCaseCatId.caseType !== CaseType.LONG_CASE) {
        throw new BadRequestException('Invalid practCaseCatUUID');
      }

      // Update conversation document
      conversation.selfGrading = rest;
      conversation.comment = comment;
      await conversation.save();

      return conversation;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Submit short case self grading
  async submitSCselfGrade(submitSCGradeInp: SubmitSCGradeInp) {
    try {
      const { conversationUUID, comment, ...rest } = submitSCGradeInp;

      const conversation = await this.getConversation(conversationUUID); // Get conversation

      if (conversation.practCaseCatId.caseType !== CaseType.SHORT_CASE) {
        throw new BadRequestException(
          'CaseType and Conversation caseType do not match',
        );
      }

      conversation.selfGrading = rest;
      return await conversation.save();
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
