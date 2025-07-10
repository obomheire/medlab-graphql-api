import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import {
  EndExaminer2Inp,
  SubmitSCGradeInp,
  SubmitLCGradeInp,
  SubmitPresLCinp,
  GetCovByCaseArgs,
} from '../dto/conversation.dto';
import { UserDocument } from 'src/user/entity/user.entity';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { ConversationService } from '../service/conversation.service';
import { ConversationEntity } from '../entity/conversation.entity';
import { GetCovByCaseRes, SubmitPresLCres } from '../types/clinicalExams.types';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { MessageRes } from 'src/auth/types/auth.types';
import { ObjectId } from 'mongodb';

@UseGuards(AccessTokenAuthGuard)
@Resolver()
export class ConversationResolver {
  constructor(private readonly conversationService: ConversationService) {}

  // Get conversation
  @Query(() => ConversationEntity)
  async getConversation(@Args('conversationUUID') conversationUUID: string) {
    return await this.conversationService.getConversation(conversationUUID);
  }

  // Get conversation by practCaseCatUUID
  @Query(() => GetCovByCaseRes)
  async getMyConvByCaseCatUUID(
    @GetUser('_id') userId: ObjectId,
    @Args()
    { practCaseCatUUID, page, limit }: GetCovByCaseArgs,
  ) {
    return await this.conversationService.getMyConvByCaseCatUUID(
      userId,
      practCaseCatUUID,
      page || 1,
      limit || 15,
    );
  }

  // Submit presentation
  @Query(() => SubmitPresLCres)
  async submitPresentationLC(
    @GetUser() user: UserDocument,
    @Args('submitPresLCinp')
    { practCaseCatUUID, patientAgentId }: SubmitPresLCinp,
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
  ) {
    return await this.conversationService.submitPresentationLC(
      user,
      practCaseCatUUID,
      patientAgentId,
      file,
    );
  }

  // End patient interaction
  @Mutation(() => MessageRes)
  async endExaminer2Interaction(
    @GetUser() user: UserDocument,
    @Args('endExaminer2Inp') endExaminer2Inp: EndExaminer2Inp,
  ) {
    return await this.conversationService.endExaminer2Interaction(
      user,
      endExaminer2Inp,
    );
  }

  // Create case category
  @Mutation(() => ConversationEntity)
  async submitLCSelfGrade(
    @Args('submitLCGradeInp') submitLCGradeInp: SubmitLCGradeInp,
  ) {
    return await this.conversationService.submitLCSelfGrade(submitLCGradeInp);
  }

  // Submit short case self grading
  @Mutation(() => ConversationEntity)
  async submitSCselfGrade(
    @Args('submitSCGradeInp') submitSCGradeInp: SubmitSCGradeInp,
  ) {
    return await this.conversationService.submitSCselfGrade(submitSCGradeInp);
  }
}
