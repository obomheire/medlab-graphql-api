import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketUser } from 'src/utilities/interface/interface';
import { WsService } from './ws.service';
import {
  AIRepliesInput,
  CreateMessageInput,
  ReplyToMessageInput,
} from '../dto/ws.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PresentationEntity } from 'src/presentation/entity/presentation.entity';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from 'src/user/entity/user.entity';
import { Model } from 'mongoose';
import { EngagementEntity } from 'src/quiz/entity/engagement.entity';
import { EngagementGuestEntity } from 'src/quiz/entity/engagement.guest.entity';
import { ChatEpisodeEntity } from 'src/chat-simulation/entities/chat-episode-entity';
import { EngagementService } from 'src/engagement/service/engagement.service';
import {
  channelCommentPrompt,
  channelCommentReplyPrompt,
  channelQuestionPrompt,
  presCommentPrompt,
  presCommentReplyPrompt,
  presQuestionPrompt,
  presQuestionReplyPrompt,
} from 'src/engagement/constant/enagagement.constant';
import { UserService } from 'src/user/service/user.service';
import { engagementCharacters } from 'src/engagement/constant/character';
import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { WsEngagementGateway } from '../gateway/ws.engagement.gateway';
import { EngagementStep, EngagementType } from 'src/quiz/enum/engagement.enum';
import { CacheService } from 'src/cache/cache.service';
import ShortUniqueId from 'short-unique-id';
import { retryWithDelay } from 'src/utilities/service/helpers.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsEngagementService {
  private readonly uuid = new ShortUniqueId({ length: 16 });
  private readonly logger = new Logger(WsService.name);

  private rooms: {
    [key: string]: {
      interval?: NodeJS.Timeout;
    };
  } = {};
  constructor(
    private readonly wsService: WsService,
    private readonly cacheService: CacheService,
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserEntity>,
    @InjectModel(EngagementEntity.name)
    private readonly engagementModel: Model<EngagementEntity>,
    @InjectModel(PresentationEntity.name)
    private readonly PresentationModel: Model<PresentationEntity>,
    @InjectModel(EngagementGuestEntity.name)
    private readonly engagementGuestModel: Model<EngagementGuestEntity>,
    @InjectModel(ChatEpisodeEntity.name)
    private readonly episodeModel: Model<ChatEpisodeEntity>,
    private readonly engagementService: EngagementService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => WsEngagementGateway))
    private readonly wsEngagementGateway: WsEngagementGateway,
  ) {}

  // Get client user and validate
  private getClientUser(client: Socket): SocketUser {
    try {
      const clientUser: SocketUser = client['user'];

      if (!clientUser) {
        client.emit('errorMessage', 'Could not find client room or name!');
      }

      return clientUser;
    } catch (error) {
      client.emit('errorMessage', error.message);
    }
  }

  // Handle connection
  async handleConnection(client: Socket, server: Server) {
    try {
      const { userUUID, name, inviteCode, url, plan, category } =
        await this.wsService.validateAudience(client);

      const catToLower = category?.toLowerCase();

      // Check if join code is provided
      if (!inviteCode) {
        throw new WsException('Invite code or join link not provided!');
      }

      // Validate invite code
      const data = await this.validateInviteCode(inviteCode, category, client);

      const ipAddress = client.handshake.address; // Get IP address
      const guest = await this.saveGustIPAddress(ipAddress, client);

      const isNotAudience = name?.toLowerCase() === 'audience' ? true : false;
      const roomName = `${inviteCode}-${catToLower}engagement`;

      client['user'] = {
        userUUID,
        name: isNotAudience ? guest?.name : name,
        code: inviteCode,
        url,
        plan,
        category,
      } as SocketUser;
      client.join(roomName); // Add audience to the room

      client['data'] = data;

      const roomClients = await server.in(roomName).fetchSockets();
      const users = roomClients.map((socket) => socket['user']);
      const dynamicEndpoint = `get${
        catToLower?.charAt(0).toUpperCase() + catToLower?.slice(1)
      }EngagementUsers`;
      client.emit(dynamicEndpoint, users);
    } catch (error) {
      client.emit('botError', error?.message);
      client.disconnect();
    }
  }

  // Handle disconnection
  async handleDisconnect(client: Socket) {
    try {
      const { code, category } = this.getClientUser(client);
      const catToLower = category?.toLowerCase();
      const roomName = `${code}-${catToLower}engagement`;
      client.leave(roomName);
    } catch (error) {
      client.emit('botError', error?.message);
      client.disconnect();
    }
  }

  async createMessage(createMessageDto: CreateMessageInput, client: Socket) {
    try {
      const { engagementType, message } = createMessageDto;
      const { userUUID, name, code, category, url } =
        this.getClientUser(client);
      const newPayload = {
        inviteCode: code,
        engagementType,
        message,
        sender: name,
        image: url,
        category,
      };

      const newMessage = new this.engagementModel({ ...newPayload });
      const savedMessage = await newMessage.save();

      const messages = await this.getMessagesByEngagementType(
        code,
        category,
        engagementType,
      );

      const roomName = `${code}-${category?.toLowerCase()}engagement`;

      this.wsEngagementGateway.server
        .to(roomName)
        .emit('fetchMessages', messages);

      const aiReplyMessageDto = {
        code,
        engagementType,
        message,
        sender: name,
        category,
        userUUID,
        name,
        parentCommentUUID: savedMessage?.commentUUID,
        id: this.uuid.randomUUID(),
        type:
          engagementType === 'COMMENT'
            ? EngagementStep.COMMENT_TO_USER
            : engagementType === 'QUESTION'
            ? EngagementStep.QUESTION_TO_USER
            : null,
      };

      await this.cacheService.setList(
        `${code?.toLowerCase()}-${category?.toLowerCase()}-messages`,
        aiReplyMessageDto,
      );

      // Start background loop
      this.startMessageProcessingLoop(code, category, client, engagementType);
      return savedMessage;
    } catch (error) {
      client.emit('botError', error?.message);
    }
  }

  async startMessageProcessingLoop(
    code: string,
    category: string,
    client?: Socket,
    engagementType?: string,
  ) {
    try {
      
      const messageKey = `${code?.toLowerCase()}-${category?.toLowerCase()}-messages`;
      const data = client['data'];

      while (true) {
        const allMessages = await this.cacheService.getList(messageKey);

        if (allMessages.length === 0) {
          break;
        }

        const shouldContinue = await this.messageToTrigger(
          client,
          data,
          category,
          code,
        );

        if (!shouldContinue) {
          break;
        }

        // Optional delay to avoid overwhelming Redis or CPU
        await new Promise((resolve) => setTimeout(resolve, 300)); // 300ms delay
      }
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  //Note, the reason for the presData is any is because it could be a presentation or episode
  async messageToTrigger(
    client?: Socket,
    presData?: any,
    category?: string,
    code?: string,
  ): Promise<boolean> {
    try {
      const messageKey = `${code?.toLowerCase()}-${category?.toLowerCase()}-messages`;

      const getNextStep = await this.checkNextStep(client);

      const engagementType =
        getNextStep === EngagementStep.COMMENT_TO_AI ||
        getNextStep === EngagementStep.COMMENT_TO_USER
          ? EngagementType.COMMENT
          : EngagementType.Q_AND_A;

      const getSingleMessage = await this.cacheService.findFirstInListByField(
        messageKey,
        { engagementType, type: getNextStep },
      );

      const allMessages = await this.cacheService.getList(messageKey);


      if (!getSingleMessage && allMessages.length === 0) {
        return false; // No more messages, stop the loop
      }


      const activateAIComment = await this.getMannuallyActivateAIStatus(
        EngagementType.COMMENT,
        client,
        code,
        category,
      );
      const activateAIQuestion = await this.getMannuallyActivateAIStatus(
        EngagementType.Q_AND_A,
        client,
        code,
        category,
      );


      const mannuallyActivateAIComment = activateAIComment ?? true;
      const mannuallyActivateAIQuestion = activateAIQuestion ?? true;



      const isEnded = await this.isPresentationOrEpisodeEnded(client);
      if (isEnded) {
        await this.cacheService.delete(messageKey);
        return false;
      }

      const canProcessQuestion =
        presData?.activateAIQuestion && mannuallyActivateAIQuestion
          ? true
          : false;
      const canProcessComment =
        presData?.activateAIComment && mannuallyActivateAIComment
          ? true
          : false;


      if (!canProcessQuestion && !canProcessComment) {
        return false;
      }

      // Delegate to proper handler — they'll delete from Redis and call setNextStep
      switch (getNextStep) {
        case EngagementStep.COMMENT_TO_AI:
          if (getSingleMessage && canProcessComment) {
            await this.aiReplyToComment(getSingleMessage, getNextStep, client);
          }
          break;
        case EngagementStep.QUESTION_TO_AI:
          if (getSingleMessage && canProcessQuestion) {
            await this.aiReplyToQuestion(getSingleMessage, getNextStep, client);
          }
          break;
        case EngagementStep.COMMENT_TO_USER:
          if (getSingleMessage && canProcessComment) {
            await this.aiUserReplyToComment(
              getSingleMessage,
              getNextStep,
              client,
            );
          }
          break;
        case EngagementStep.QUESTION_TO_USER:
          if (getSingleMessage && canProcessQuestion) {
            await this.aiUserReplyToQuestion(
              getSingleMessage,
              getNextStep,
              client,
            );
          }
          break;
        default:
          return false;
      }

      //Re-check message queue — if empty, signal to stop interval
      const remaining = await this.cacheService.getList(messageKey);
      if (remaining.length > 0) {
        await this.setNextStep(getNextStep, client);
        return true;
      }
      return false;
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  // Reply to a message
  async replyToMessage(replyMessageDto: ReplyToMessageInput, client: Socket) {
    try {
      const { parentCommentUUID, message, engagementType } = replyMessageDto;
      const { userUUID, name, code, category, url } =
        this.getClientUser(client);
      let type = null;

      const parentMessage = await this.engagementModel.findOne({
        commentUUID: parentCommentUUID,
      });
      if (!parentMessage) {
        client.emit('botError', 'Parent comment not found');
      }

      //This is to determine the type of message to be sent and the type of message to be sent to the AI
      if (engagementType === 'COMMENT' && parentMessage?.isAI) {
        type = EngagementStep.COMMENT_TO_AI;
      } else if (engagementType === 'QUESTION' && parentMessage?.isAI) {
        type = EngagementStep.QUESTION_TO_AI;
      } else if (engagementType === 'COMMENT' && !parentMessage?.isAI) {
        type = EngagementStep.COMMENT_TO_USER;
      } else if (engagementType === 'QUESTION' && !parentMessage?.isAI) {
        type = EngagementStep.QUESTION_TO_USER;
      }
      const aiReplyMessageDto = {
        code,
        engagementType,
        message,
        sender: name,
        category,
        userUUID,
        name,
        parentCommentUUID,
        id: null,
        type,
      };

      const newPayload = {
        inviteCode: code,
        engagementType,
        message,
        sender: name,
        image: url,
        category,
        parentId: parentCommentUUID,
      };
      const newMessage = new this.engagementModel({ ...newPayload });
      await newMessage.save();

      // Add reply reference to parent message
      parentMessage.replies.push(newMessage.id);
      await parentMessage.save();

      const messages = await this.getMessagesByEngagementType(
        code,
        category,
        engagementType,
      );

      const roomName = `${code}-${category?.toLowerCase()}engagement`;

      this.wsEngagementGateway.server
        .to(roomName)
        .emit('fetchMessages', messages);

      //This is to get the character name for the AI to reply to the question or comment
      const getCharacter =
        engagementType?.toLowerCase() === 'comment'
          ? engagementCharacters[0].name
          : engagementCharacters[2].name;

      // if (parentMessage?.sender === getCharacter) {
      aiReplyMessageDto.id = this.uuid.randomUUID();
      await this.cacheService.setList(
        `${code?.toLowerCase()}-${category?.toLowerCase()}-messages`,
        aiReplyMessageDto,
      );

      //This is to start the AI to reply to the comment
      this.startMessageProcessingLoop(code, category, client);
      // }
      return newMessage;
    } catch (error) {
      client.emit('botError', error?.message);
    }
  }

  // Retrieve all messages with nested replies
  async getMessages(
    client: Socket,
    engagementType: string,
  ): Promise<EngagementEntity[]> {
    try {
      const { code, category } = this.getClientUser(client);

      const topLevelMessages = await this.engagementModel
        .find({
          inviteCode: code,
          engagementType,
          category,
          parentId: null, // only fetch top-level messages
        })
        .populate({
          path: 'replies',
          populate: {
            path: 'replies', // optionally populate nested replies
          },
        });

      return topLevelMessages;
    } catch (error) {
      client.emit('botError', error?.message);
    }
  }

  // Retrieve all messages with nested replies
  async getMessagesByEngagementType(
    code: string,
    category: string,
    engagementType: string,
  ): Promise<EngagementEntity[]> {
    try {
      const topLevelMessages = await this.engagementModel
        .find({
          inviteCode: code,
          engagementType,
          category,
          parentId: null, // only fetch top-level messages
        })
        .populate({
          path: 'replies',
          populate: {
            path: 'replies', // optionally populate nested replies
          },
        });

      return topLevelMessages;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Retrieve a single message by UUID with nested replies
  async getMessageByUUID(
    commentUUID: string,
    client: Socket,
  ): Promise<EngagementEntity> {
    try {
      const { code } = this.getClientUser(client);
      const message = await this.engagementModel
        .findOne({ commentUUID, inviteCode: code })
        .populate('replies');
      if (!message) {
        client.emit('botError', 'Message not found');
      }
      return message;
    } catch (error) {
      client.emit('botError', error?.message);
    }
  }

  //Like a message
  async likeMessage(
    commentUUID: string,
    client: Socket,
  ): Promise<EngagementEntity> {
    try {
      const { userUUID, code } = this.getClientUser(client);
      const ipAddress = client.handshake.address; // Get IP address
      const foundUser = await this.userModel.findOne({ userUUID });
      const guest = await this.getGuestByIPAddress(ipAddress);

      const message = await this.engagementModel.findOne({ commentUUID });
      if (!message) {
        client.emit('botError', 'Message not found');
      }

      if (foundUser) {
        if (message.usersLikes.includes(userUUID)) {
          message.usersLikes = message.usersLikes.filter(
            (like) => like !== userUUID,
          );
          message.likes -= 1;
        } else {
          message.usersLikes.push(userUUID);
          message.likes += 1;
        }
      } else {
        if (message.usersLikes.includes(guest?.guestUUID)) {
          message.usersLikes = message.usersLikes.filter(
            (like) => like !== guest?.guestUUID,
          );
          message.likes -= 1;
        } else {
          message.usersLikes.push(guest?.guestUUID);
          message.likes += 1;
        }
      }

      await message.save();
      return message;
    } catch (error) {
      client.emit('botError', error?.message);
    }
  }

  async isTypingComment(client: Socket, server: Server, status: boolean) {
    try {
      const { code, name, category } = this.getClientUser(client);
      const catToLower = category?.toLowerCase();
      const roomName = `${code}-${catToLower}engagement`;
      const setEmmiter =
        category?.toLowerCase() === 'slide'
          ? 'isTypingSlideComment'
          : 'isTypingChannelComment';
      server.to(roomName).emit(setEmmiter, {
        name: name,
        isTyping: status,
      });
    } catch (error) {
      client.emit('botError', error?.message);
    }
  }

  async isTypingQuestion(client: Socket, server: Server, status: boolean) {
    try {
      const { code, name, category } = this.getClientUser(client);
      const catToLower = category?.toLowerCase();
      const roomName = `${code}-${catToLower}engagement`;
      const setEmmiter =
        category?.toLowerCase() === 'slide'
          ? 'isTypingSlideQuestion'
          : 'isTypingChannelQuestion';
      server.to(roomName).emit(setEmmiter, {
        name: name,
        isTyping: status,
      });
    } catch (error) {
      client.emit('botError', error?.message);
    }
  }

  // Get guest by IP address for slide and channel
  async getGuestByIPAddress(ipAddress: string) {
    try {
      const guest = await this.engagementGuestModel.findOne({ ipAddress });
      return guest;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  //This method is used to get all the guest by IP address
  async getAllGuestByIPAddress() {
    try {
      const guest = await this.engagementGuestModel.find();
      return guest;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  //This method is used by the AI to start the comment
  async startAIComment(presUUID: string, category: string) {
    try {
      if (category?.toLowerCase() === 'slide') {
        const foundPresentation = await this.PresentationModel.findOne({
          presUUID,
        });
        if (foundPresentation) {
          const {
            userId,
            threadId: presentationThreadId,
            inviteCode,
            title,
            subTitle,
            note,
          } = foundPresentation;
          const foundUser = await this.userService.getUserByObjectId(userId);

          //This is to emit the isTypingComment event to the client
          this.wsEngagementGateway.server
            .to(inviteCode)
            .emit('isTypingSlideComment', {
              name: engagementCharacters[0].name,
              isTyping: true,
            });

          const manualPrompt = `
            Title: ${title}
            Subtitle: ${subTitle}
            Note: ${note}
          `;
          const prompt = presCommentPrompt(presentationThreadId, manualPrompt); //This is the prompt for the AI to generate a comment
          const response = await this.engagementService.aiAssistant(
            prompt,
            presentationThreadId,
            foundUser,
          );
          //This is to check if the AI has generated a comment and then save it to the database
          if (response) {
            const { comment, threadId, messageId } = response;
            const newPayload = {
              inviteCode,
              engagementType: EngagementType.COMMENT,
              message: comment,
              sender: engagementCharacters[0].name,
              image: engagementCharacters[0].image,
              category: category?.toUpperCase(),
              messageThread: presentationThreadId ? null : threadId,
              isAI: true,
            };

            const newMessage = new this.engagementModel({ ...newPayload });
            const savedMessage = await newMessage.save();
            //this fires the isTypingSlideComment event to the client
            this.wsEngagementGateway.server
              .to(inviteCode)
              .emit('isTypingSlideComment', {
                name: engagementCharacters[0].name,
                isTyping: true,
              });
            //this fires the createSlideComment event to the client
            this.wsEngagementGateway.server
              .to(inviteCode)
              .emit('createSlideComment', savedMessage);
            //this fires the fetchMessages event to the client
            const messages = await this.getMessagesByEngagementType(
              inviteCode,
              category,
              EngagementType.COMMENT,
            );
            this.wsEngagementGateway.server
              .to(inviteCode)
              .emit('fetchMessages', messages);
          }
        }
      } else if (category?.toLowerCase() === 'channel') {
        const foundEpisode = await this.episodeModel.findOne({
          episodeUUID: presUUID,
        });
        const medScrollId = new ObjectId(
          this.configService.get<string>('MEDSCROLL_ID'),
        );

        const foundUser = await this.userService.getUserByObjectId(medScrollId);
        if (foundEpisode) {
          const { threadId: channelThreadId, joinCode } = foundEpisode;
          const prompt = channelCommentPrompt();
          this.wsEngagementGateway.server
            .to(joinCode)
            .emit('isTypingChannelComment', {
              name: engagementCharacters[0].name,
              isTyping: true,
            });

          const content = await retryWithDelay(
            async () => {
              const response = await this.engagementService.aiAssistant(
                prompt,
                channelThreadId,
                foundUser,
              );
              if (!response) {
                throw new WsException('Assistant returned empty content.');
              }
              return response;
            },
            30, // Max retries
            1000, // 1-minute delay between retries
          );

          if (content) {
            const { comment, threadId, messageId } = content;
            const newPayload = {
              inviteCode: joinCode,
              engagementType: EngagementType.COMMENT,
              message: comment,
              sender: engagementCharacters[0].name,
              image: engagementCharacters[0].image,
              category,
              messageThread: channelThreadId ? null : messageId,
              isAI: true,
            };

            const newMessage = new this.engagementModel({ ...newPayload });
            const savedMessage = await newMessage.save();
            this.wsEngagementGateway.server
              .to(joinCode)
              .emit('isTypingChannelComment', {
                name: engagementCharacters[0].name,
                isTyping: false,
              });
            this.wsEngagementGateway.server
              .to(joinCode)
              .emit('createChannelComment', savedMessage);
          }
        }
      }
    } catch (error) {}
  }

  //This method is used by the AI to start the question
  async startAIQuestion(presUUID: string, category: string) {
    try {
      if (category?.toLowerCase() === 'slide') {
        const foundPresentation = await this.PresentationModel.findOne({
          presUUID,
        });
        if (foundPresentation) {
          const {
            userId,
            threadId: presentationThreadId,
            inviteCode,
            title,
            subTitle,
            note,
          } = foundPresentation;
          const foundUser = await this.userService.getUserByObjectId(userId);

          //This is to emit the isTypingQuestion event to the client
          this.wsEngagementGateway.server
            .to(inviteCode)
            .emit('isTypingSlideQuestion', {
              name: engagementCharacters[2].name,
              isTyping: true,
            });

          const manualPrompt = `
            Title: ${title}
            Subtitle: ${subTitle}
            Note: ${note}
          `;

          const prompt = presQuestionPrompt(presentationThreadId, manualPrompt); //This is the prompt for the AI to generate a question
          const response = await this.engagementService.aiAssistant(
            prompt,
            presentationThreadId,
            foundUser,
          );
          //This is to check if the AI has generated a question and then save it to the database
          if (response) {
            const { comment, threadId, messageId } = response;
            const newPayload = {
              inviteCode,
              engagementType: EngagementType.Q_AND_A,
              message: comment,
              sender: engagementCharacters[2].name,
              image: engagementCharacters[2].image,
              category: category?.toUpperCase(),
              messageThread: presentationThreadId ? null : threadId,
              isAI: true,
            };

            const newMessage = new this.engagementModel({ ...newPayload });
            const savedMessage = await newMessage.save();
            this.wsEngagementGateway.server
              .to(inviteCode)
              .emit('isTypingSlideQuestion', {
                name: engagementCharacters[2].name,
                isTyping: true,
              });
            this.wsEngagementGateway.server
              .to(inviteCode)
              .emit('createSlideQuestion', savedMessage);
            //this fires the fetchMessages event to the client
            const messages = await this.getMessagesByEngagementType(
              inviteCode,
              category,
              EngagementType.COMMENT,
            );
            this.wsEngagementGateway.server
              .to(inviteCode)
              .emit('fetchMessages', messages);
          }
        }
      } else if (category?.toLowerCase() === 'channel') {
      } else if (category?.toLowerCase() === 'channel') {
        const foundEpisode = await this.episodeModel.findOne({
          episodeUUID: presUUID,
        });
        const medScrollId = new ObjectId(
          this.configService.get<string>('MEDSCROLL_ID'),
        );

        const foundUser = await this.userService.getUserByObjectId(medScrollId);
        if (foundEpisode) {
          const { threadId: channelThreadId, joinCode } = foundEpisode;
          const prompt = channelQuestionPrompt();
          this.wsEngagementGateway.server
            .to(joinCode)
            .emit('isTypingChannelQuestion', {
              name: engagementCharacters[2].name,
              isTyping: true,
            });

          const content = await retryWithDelay(
            async () => {
              const response = await this.engagementService.aiAssistant(
                prompt,
                channelThreadId,
                foundUser,
              );
              if (!response) {
                throw new WsException('Assistant returned empty content.');
              }
              return response;
            },
            30, // Max retries
            1000, // 1-minute delay between retries
          );

          if (content) {
            const { comment, threadId, messageId } = content;
            const newPayload = {
              inviteCode: joinCode,
              engagementType: EngagementType.Q_AND_A,
              message: comment,
              sender: engagementCharacters[2].name,
              image: engagementCharacters[2].image,
              category,
              messageThread: channelThreadId ? null : messageId,
              isAI: true,
            };

            const newMessage = new this.engagementModel({ ...newPayload });
            const savedMessage = await newMessage.save();
            this.wsEngagementGateway.server
              .to(joinCode)
              .emit('isTypingChannelQuestion', {
                name: engagementCharacters[2].name,
                isTyping: false,
              });
            this.wsEngagementGateway.server
              .to(joinCode)
              .emit('createChannelQuestion', savedMessage);
          }
        }
      }
    } catch (error) {}
  }

  //This is used to check what should be processed next
  async checkNextStep(client?: Socket): Promise<EngagementStep> {
    try {

      const { category, code } = this.getClientUser(client);
      const key = `${code?.toLowerCase()}-${category?.toLowerCase()}-is-next`; //this is used to tell what should be processed next

      const getNextStep = await this.cacheService.get(key);

      if (getNextStep) {
        return getNextStep;
      } else {
        return EngagementStep.COMMENT_TO_AI;
      }
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  //This is used to set the presentation or episode ended
  async setPresentationOrEpisodeEnded(status: boolean, client?: Socket) {
    try {
      const { category, code } = this.getClientUser(client);
      const key = `${code?.toLowerCase()}-${category?.toLowerCase()}-is-ended`;
      await this.cacheService.set(key, status);
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  async isPresentationOrEpisodeEnded(client?: Socket) {
    try {
      const { category, code } = this.getClientUser(client);
      const key = `${code?.toLowerCase()}-${category?.toLowerCase()}-is-ended`;
      const isEnded = await this.cacheService.get(key);
      return isEnded;
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  //This is used to set the manually activate AI status from the presentation or episode
  async setMannuallyActivateAIStatus(
    activateAI: boolean,
    type: EngagementType,
    client?: Socket,
  ) {
    try {
      const { category, code } = this.getClientUser(client);
      const key = `${code?.toLowerCase()}-${category?.toLowerCase()}-${type?.toLowerCase()}`; //this is the key to hold the status of the manually activate AI status
      await this.cacheService.set(key, activateAI);

      await this.messageToTrigger(client, client['data'], category, code);
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  //This is used to get the manually activate AI status from the presentation or episode
  async getMannuallyActivateAIStatus(
    type: EngagementType,
    client?: Socket,
    code?: string,
    category?: string,
  ): Promise<boolean | undefined> {
    try {
      const key = `${code?.toLowerCase()}-${category?.toLowerCase()}-${type?.toLowerCase()}`;

      const status = await this.cacheService.get(key);
      return status;
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  //This is used to set what should be processed next
  async setNextStep(step: EngagementStep, client?: Socket) {
    try {
      const steps = [
        EngagementStep.COMMENT_TO_AI,
        EngagementStep.QUESTION_TO_AI,
        EngagementStep.COMMENT_TO_USER,
        EngagementStep.QUESTION_TO_USER,
      ];

      // Find the index of the current step
      const currentIndex = steps.indexOf(step);

      // Determine the next step (loop back to 0 if at the end)
      const nextIndex = (currentIndex + 1) % steps.length;
      const nextStep = steps[nextIndex];

      const { category, code } = this.getClientUser(client);
      const key = `${code?.toLowerCase()}-${category?.toLowerCase()}-is-next`;

      await this.cacheService.set(key, nextStep);
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  async aiReplyToComment(
    payload: AIRepliesInput,
    step: EngagementStep,
    client?: Socket,
  ) {
    try {
      const {
        message,
        engagementType,
        parentCommentUUID,
        category,
        code,
        name,
        id,
      } = payload;

      const messageKey = `${code?.toLowerCase()}-${category?.toLowerCase()}-messages`;

      const foundComment = await this.engagementModel
        .findOne({ commentUUID: parentCommentUUID })
        .populate('replies');

      //This is to format the message to be used in the prompt for the AI to reply to the comment by getting the previous conversation between the both of you
      const formattedMessage = foundComment?.replies?.length
        ? foundComment?.replies
            ?.filter((reply) => reply?.sender === name)
            ?.map(
              (reply) =>
                `${
                  reply?.sender === engagementCharacters[0]?.name
                    ? 'You'
                    : reply?.sender
                }: ${reply?.message}`,
            )
            .join('\n')
        : `You: ${foundComment?.message}`;

      let presOrEpsiodeAuthor = null;
      let presOrEpsiodeThreadId = foundComment?.messageThread;

      let presEpisodeThreadId = null;
      let presThreadId = null;

      if (category?.toLowerCase() === 'slide') {
        const foundPresentation = client['data'];
        if (foundPresentation) {
          const { userId, threadId: presentationThreadId } = foundPresentation;
          presThreadId = presentationThreadId;
          presOrEpsiodeAuthor = await this.userService.getUserByObjectId(
            userId,
          );
          presOrEpsiodeThreadId = presentationThreadId
            ? presentationThreadId
            : foundComment?.messageThread;
        }
      } else if (category?.toLowerCase() === 'channel') {
        const medScrollId = new ObjectId(
          this.configService.get<string>('MEDSCROLL_ID'),
        );
        presOrEpsiodeAuthor = await this.userService.getUserByObjectId(
          medScrollId,
        );
        const foundEpisode = await this.episodeModel.findOne({
          joinCode: code,
        });

        presEpisodeThreadId = foundEpisode?.threadId;
        if (foundEpisode) {
          presOrEpsiodeThreadId = foundEpisode.threadId
            ? foundEpisode.threadId
            : foundComment?.messageThread;
        }
      }

      const prompt =
        category?.toLowerCase() === 'slide'
          ? presCommentReplyPrompt({
              parentMessage: formattedMessage,
              childMessage: message,
            })
          : category?.toLowerCase() === 'channel'
          ? channelCommentReplyPrompt({
              parentMessage: formattedMessage,
              childMessage: message,
            })
          : null;

      //This is to emit the isTypingComment event to the client
      const catToLower = category?.toLowerCase();
      const roomName = `${code}-${catToLower}engagement`;
      const setEmmiter =
        category?.toLowerCase() === 'slide'
          ? 'isTypingSlideComment'
          : 'isTypingChannelComment';
      this.wsEngagementGateway.server.to(roomName).emit(setEmmiter, {
        name: engagementCharacters[0].name,
        isTyping: true,
      });

      const content = await retryWithDelay(
        async () => {
          const response = await this.engagementService.aiAssistant(
            prompt,
            presOrEpsiodeThreadId,
            presOrEpsiodeAuthor,
          );
          if (!response) {
            throw new WsException('Assistant returned empty content.');
          }
          return response;
        },
        30,
        10000,
      );

      if (content) {
        const newPayload = {
          inviteCode: code,
          engagementType,
          message: content?.comment,
          sender: engagementCharacters[0].name,
          image: engagementCharacters[0].image,
          category,
          messageThread: foundComment?.messageThread,
          parentId: parentCommentUUID,
          isAI: true,
        };
        const newMessage = new this.engagementModel({ ...newPayload });
        await newMessage.save();

        //This is to emit the isTypingComment event to the client
        const catToLower = category?.toLowerCase();
        const roomName = `${code}-${catToLower}engagement`;
        this.wsEngagementGateway.server.to(roomName).emit(setEmmiter, {
          name: engagementCharacters[0].name,
          isTyping: false,
        });

        //This is to emit the replyMessage event to the client
        const setReplyEmmiter =
          category?.toLowerCase() === 'slide'
            ? 'replySlideComment'
            : 'replyChannelComment';
        this.wsEngagementGateway.server
          .to(code)
          .emit(setReplyEmmiter, newMessage);

        //this fires the fetchMessages event to the client
        const messages = await this.getMessagesByEngagementType(
          code,
          category,
          EngagementType.COMMENT,
        );
        this.wsEngagementGateway.server
          .to(roomName)
          .emit('fetchMessages', messages);

        await this.engagementModel.findByIdAndUpdate(foundComment._id, {
          $push: { replies: newMessage._id },
        });
      }

      //This is to delete the message from the list
      await this.cacheService.deleteItemFromList(messageKey, payload);
      //This is to set the next step
      await this.setNextStep(step, client);
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  async aiUserReplyToComment(
    payload: AIRepliesInput,
    step: EngagementStep,
    client?: Socket,
  ) {
    try {
      const {
        message,
        engagementType,
        parentCommentUUID,
        category,
        code,
        name,
        id,
        sender,
      } = payload;

      const messageKey = `${code?.toLowerCase()}-${category?.toLowerCase()}-messages`;
      //this will get a random person from the engagementCharacters array
      const randomPerson =
        engagementCharacters[
          Math.floor(Math.random() * engagementCharacters.length)
        ];

      const foundComment = await this.engagementModel
        .findOne({ commentUUID: parentCommentUUID })
        .populate('replies');

      //This is to format the message to be used in the prompt for the AI to reply to the comment by getting the previous conversation between the both of you
      const formattedMessage = foundComment?.replies?.length
        ? foundComment?.replies
            ?.filter((reply) => reply?.sender === name)
            ?.map(
              (reply) =>
                `${
                  reply?.sender === randomPerson?.name ? 'You' : reply?.sender
                }: ${reply?.message}`,
            )
            .join('\n')
        : `You: ${foundComment?.message}`;

      let presOrEpsiodeAuthor = null;
      let presOrEpsiodeThreadId = foundComment?.messageThread;

      let presEpisodeThreadId = null;
      let presThreadId = null;

      if (category?.toLowerCase() === 'slide') {
        const foundPresentation = client['data'];
        if (foundPresentation) {
          const { userId, threadId: presentationThreadId } = foundPresentation;
          presThreadId = presentationThreadId;
          presOrEpsiodeAuthor = await this.userService.getUserByObjectId(
            userId,
          );
          presOrEpsiodeThreadId = presentationThreadId
            ? presentationThreadId
            : foundComment?.messageThread;
        }
      } else if (category?.toLowerCase() === 'channel') {
        const medScrollId = new ObjectId(
          this.configService.get<string>('MEDSCROLL_ID'),
        );
        presOrEpsiodeAuthor = await this.userService.getUserByObjectId(
          medScrollId,
        );
        const foundEpisode = await this.episodeModel.findOne({
          joinCode: code,
        });

        presEpisodeThreadId = foundEpisode?.threadId;
        if (foundEpisode) {
          presOrEpsiodeThreadId = foundEpisode.threadId
            ? foundEpisode.threadId
            : foundComment?.messageThread;
        }
      }

      const prompt =
        category?.toLowerCase() === 'slide'
          ? presCommentReplyPrompt({
              parentMessage: formattedMessage,
              childMessage: message,
            })
          : category?.toLowerCase() === 'channel'
          ? channelCommentReplyPrompt({
              parentMessage: formattedMessage,
              childMessage: message,
            })
          : null;

      //This is to emit the isTypingComment event to the client
      const catToLower = category?.toLowerCase();
      const roomName = `${code}-${catToLower}engagement`;
      const setEmmiter =
        category?.toLowerCase() === 'slide'
          ? 'isTypingSlideComment'
          : 'isTypingChannelComment';
      this.wsEngagementGateway.server.to(roomName).emit(setEmmiter, {
        name: randomPerson?.name,
        isTyping: true,
      });

      const content = await retryWithDelay(
        async () => {
          const response = await this.engagementService.aiAssistant(
            prompt,
            presOrEpsiodeThreadId,
            presOrEpsiodeAuthor,
          );
          if (!response) {
            throw new WsException('Assistant returned empty content.');
          }
          return response;
        },
        30,
        10000,
      );

      if (content) {
        const newPayload = {
          inviteCode: code,
          engagementType,
          message: content?.comment,
          sender: randomPerson?.name,
          image: randomPerson?.image,
          category,
          messageThread: foundComment?.messageThread,
          parentId: parentCommentUUID,
          isAI: true,
        };
        const newMessage = new this.engagementModel({ ...newPayload });
        await newMessage.save();

        //This is to emit the isTypingComment event to the client
        const catToLower = category?.toLowerCase();
        const roomName = `${code}-${catToLower}engagement`;
        this.wsEngagementGateway.server.to(roomName).emit(setEmmiter, {
          name: randomPerson?.name,
          isTyping: false,
        });

        //This is to emit the replyMessage event to the client
        const setReplyEmmiter =
          category?.toLowerCase() === 'slide'
            ? 'replySlideComment'
            : 'replyChannelComment';
        this.wsEngagementGateway.server
          .to(code)
          .emit(setReplyEmmiter, newMessage);

        //this fires the fetchMessages event to the client
        const messages = await this.getMessagesByEngagementType(
          code,
          category,
          EngagementType.COMMENT,
        );
        this.wsEngagementGateway.server
          .to(roomName)
          .emit('fetchMessages', messages);

        await this.engagementModel.findByIdAndUpdate(foundComment._id, {
          $push: { replies: newMessage._id },
        });
      }

      //This is to delete the message from the list
      await this.cacheService.deleteItemFromList(messageKey, payload);
      //This is to set the next step
      await this.setNextStep(step);
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  //Method for handling AI reply to comment that are targeted to them
  async aiReplyToQuestion(
    payload: AIRepliesInput,
    step: EngagementStep,
    client?: Socket,
  ) {
    try {
      const {
        message,
        engagementType,
        parentCommentUUID,
        category,
        code,
        name,
        id,
      } = payload;

      const messageKey = `${code?.toLowerCase()}-${category?.toLowerCase()}-messages`;

      const foundComment = await this.engagementModel
        .findOne({ commentUUID: parentCommentUUID })
        .populate('replies');

      //This is to format the message to be used in the prompt for the AI to reply to the question by getting the previous conversation between the both of you
      const formattedMessage = foundComment?.replies?.length
        ? foundComment?.replies
            ?.filter((reply) => reply?.sender === name)
            .map(
              (reply) =>
                `${
                  reply?.sender === engagementCharacters[2]?.name
                    ? 'You'
                    : reply?.sender
                }: ${reply?.message}`,
            )
            .join('\n')
        : `You: ${foundComment?.message}`;

      let presOrEpsiodeAuthor = null;
      let presOrEpsiodeThreadId = foundComment?.messageThread;

      if (category?.toLowerCase() === 'slide') {
        const foundPresentation = client['data'];
        if (foundPresentation) {
          const { userId, threadId: presentationThreadId } = foundPresentation;
          presOrEpsiodeAuthor = await this.userService.getUserByObjectId(
            userId,
          );
          presOrEpsiodeThreadId = presentationThreadId
            ? presentationThreadId
            : foundComment?.messageThread;
        }
      } else if (category?.toLowerCase() === 'channel') {
        const medScrollId = new ObjectId(
          this.configService.get<string>('MEDSCROLL_ID'),
        );
        presOrEpsiodeAuthor = await this.userService.getUserByObjectId(
          medScrollId,
        );
        const foundEpisode = await this.episodeModel.findOne({
          joinCode: code,
        });
        if (foundEpisode) {
          presOrEpsiodeThreadId = foundEpisode.threadId
            ? foundEpisode.threadId
            : foundComment?.messageThread;
        }
      }

      const prompt =
        category?.toLowerCase() === 'slide'
          ? presQuestionReplyPrompt({
              parentMessage: formattedMessage,
              childMessage: message,
            })
          : category?.toLowerCase() === 'channel'
          ? channelCommentReplyPrompt({
              parentMessage: formattedMessage,
              childMessage: message,
            })
          : null;

      //This is to emit the isTypingComment event to the client
      const catToLower = category?.toLowerCase();
      const roomName = `${code}-${catToLower}engagement`;
      const setEmmiter =
        category?.toLowerCase() === 'slide'
          ? 'isTypingSlideComment'
          : 'isTypingChannelComment';
      this.wsEngagementGateway.server.to(roomName).emit(setEmmiter, {
        name: engagementCharacters[0].name,
        isTyping: true,
      });

      const content = await retryWithDelay(
        async () => {
          const response = await this.engagementService.aiAssistant(
            prompt,
            presOrEpsiodeThreadId,
            presOrEpsiodeAuthor,
          );
          if (!response) {
            throw new WsException('Assistant returned empty content.');
          }
          return response;
        },
        20,
        10000,
      );

      if (content) {
        const newPayload = {
          inviteCode: code,
          engagementType,
          message: content?.comment,
          sender: engagementCharacters[0].name,
          image: engagementCharacters[0].image,
          category,
          messageThread: foundComment?.messageThread,
          parentId: parentCommentUUID,
          isAI: true,
        };
        const newMessage = new this.engagementModel({ ...newPayload });
        await newMessage.save();

        //This is to emit the isTypingComment event to the client
        this.wsEngagementGateway.server.to(roomName).emit(setEmmiter, {
          name: engagementCharacters[0].name,
          isTyping: false,
        });

        //This is to emit the replyMessage event to the client
        const setReplyEmmiter =
          category?.toLowerCase() === 'slide'
            ? 'replySlideQuestion'
            : 'replyChannelQuestion';
        this.wsEngagementGateway.server
          .to(roomName)
          .emit(setReplyEmmiter, newMessage);

        //this fires the fetchMessages event to the client
        const messages = await this.getMessagesByEngagementType(
          code,
          category,
          EngagementType.COMMENT,
        );
        this.wsEngagementGateway.server
          .to(roomName)
          .emit('fetchMessages', messages);

        await this.engagementModel.findByIdAndUpdate(foundComment._id, {
          $push: { replies: newMessage._id },
        });
      }

      //This is to delete the message from the list
      await this.cacheService.deleteItemFromList(messageKey, payload);
      //This is to set the next step
      await this.setNextStep(step);
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  //Method for handling AI reply to user comment that are targeted to them
  async aiUserReplyToQuestion(
    payload: AIRepliesInput,
    step: EngagementStep,
    client?: Socket,
  ) {
    try {
      const {
        message,
        engagementType,
        parentCommentUUID,
        category,
        code,
        name,
        id,
        sender,
      } = payload;

      const messageKey = `${code?.toLowerCase()}-${category?.toLowerCase()}-messages`;
      const randomPerson =
        engagementCharacters[
          Math.floor(Math.random() * engagementCharacters.length)
        ];

      const foundComment = await this.engagementModel
        .findOne({ commentUUID: parentCommentUUID })
        .populate('replies');

      //This is to format the message to be used in the prompt for the AI to reply to the question by getting the previous conversation between the both of you
      const formattedMessage = foundComment?.replies?.length
        ? foundComment?.replies
            ?.filter((reply) => reply?.sender === name)
            .map(
              (reply) =>
                `${
                  reply?.sender === randomPerson?.name ? 'You' : reply?.sender
                }: ${reply?.message}`,
            )
            .join('\n')
        : `You: ${foundComment?.message}`;

      let presOrEpsiodeAuthor = null;
      let presOrEpsiodeThreadId = foundComment?.messageThread;

      if (category?.toLowerCase() === 'slide') {
        const foundPresentation = client['data'];
        if (foundPresentation) {
          const { userId, threadId: presentationThreadId } = foundPresentation;
          presOrEpsiodeAuthor = await this.userService.getUserByObjectId(
            userId,
          );
          presOrEpsiodeThreadId = presentationThreadId
            ? presentationThreadId
            : foundComment?.messageThread;
        }
      } else if (category?.toLowerCase() === 'channel') {
        const medScrollId = new ObjectId(
          this.configService.get<string>('MEDSCROLL_ID'),
        );
        presOrEpsiodeAuthor = await this.userService.getUserByObjectId(
          medScrollId,
        );
        const foundEpisode = await this.episodeModel.findOne({
          joinCode: code,
        });
        if (foundEpisode) {
          presOrEpsiodeThreadId = foundEpisode.threadId
            ? foundEpisode.threadId
            : foundComment?.messageThread;
        }
      }

      const prompt =
        category?.toLowerCase() === 'slide'
          ? presCommentReplyPrompt({
              parentMessage: formattedMessage,
              childMessage: message,
            })
          : category?.toLowerCase() === 'channel'
          ? channelCommentReplyPrompt({
              parentMessage: formattedMessage,
              childMessage: message,
            })
          : null;

      //This is to emit the isTypingComment event to the client
      const catToLower = category?.toLowerCase();
      const roomName = `${code}-${catToLower}engagement`;
      const setEmmiter =
        category?.toLowerCase() === 'slide'
          ? 'isTypingSlideComment'
          : 'isTypingChannelComment';
      this.wsEngagementGateway.server.to(roomName).emit(setEmmiter, {
        name: randomPerson?.name,
        isTyping: true,
      });

      const content = await retryWithDelay(
        async () => {
          const response = await this.engagementService.aiAssistant(
            prompt,
            presOrEpsiodeThreadId,
            presOrEpsiodeAuthor,
          );
          if (!response) {
            throw new WsException('Assistant returned empty content.');
          }
          return response;
        },
        20,
        10000,
      );

      if (content) {
        const newPayload = {
          inviteCode: code,
          engagementType,
          message: content?.comment,
          sender: randomPerson?.name,
          image: randomPerson?.image,
          category,
          messageThread: foundComment?.messageThread,
          parentId: parentCommentUUID,
          isAI: true,
        };
        const newMessage = new this.engagementModel({ ...newPayload });
        await newMessage.save();

        //This is to emit the isTypingComment event to the client
        this.wsEngagementGateway.server.to(roomName).emit(setEmmiter, {
          name: randomPerson?.name,
          isTyping: false,
        });

        //This is to emit the replyMessage event to the client
        const setReplyEmmiter =
          category?.toLowerCase() === 'slide'
            ? 'replySlideQuestion'
            : 'replyChannelQuestion';
        this.wsEngagementGateway.server
          .to(roomName)
          .emit(setReplyEmmiter, newMessage);

        //this fires the fetchMessages event to the client
        const messages = await this.getMessagesByEngagementType(
          code,
          category,
          EngagementType.COMMENT,
        );
        this.wsEngagementGateway.server
          .to(roomName)
          .emit('fetchMessages', messages);

        await this.engagementModel.findByIdAndUpdate(foundComment._id, {
          $push: { replies: newMessage._id },
        });
      }

      //This is to delete the message from the list
      await this.cacheService.deleteItemFromList(messageKey, payload);
      //This is to set the next step
      await this.setNextStep(step);
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  // this is used to get the category and code from the client
  async getCategoryAndCode(client?: Socket) {
    try {
      let category = null;
      let code = null;

      await this.wsEngagementGateway.server.fetchSockets().then((sockets) => {
        category = sockets[0]?.handshake?.headers?.category;
        code = sockets[0]?.handshake?.headers?.code;
      });
      return { category, code };
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }

  // Save guest IP address for slide and channel
  async saveGustIPAddress(
    ipAddress: string,
    client?: Socket,
  ): Promise<EngagementGuestEntity> {
    try {
      const allGuest = await this.engagementGuestModel.find();
      const newPayload = {
        ipAddress,
        name: `Guest ${allGuest.length + 1}`,
        image: null,
      };
      const foundIp = await this.engagementGuestModel.findOne({ ipAddress });
      if (!foundIp) {
        const newIp = new this.engagementGuestModel({ ...newPayload });
        const savedIp = await newIp.save();
        return savedIp;
      } else {
        return foundIp;
      }
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Validate invite code for slide and channel
  async validateInviteCode(
    inviteCode: string,
    category: string,
    client: Socket,
  ) {
    try {
      let foundInviteCode = null;
      if (category?.toLowerCase() === 'slide') {
        foundInviteCode = await this.PresentationModel.findOne({ inviteCode });
      } else if (category?.toLowerCase() === 'channel') {
        foundInviteCode = await this.episodeModel.findOne({ inviteCode });
      }
      if (!foundInviteCode) {
        throw new WsException('Invite code not found');
      }
      return foundInviteCode;
    } catch (error) {
      throw new WsException(error?.message);
    }
  }

  async validateInput(
    DtoClass: any,
    data: any,
    client?: Socket,
  ): Promise<string | null> {
    try {
      const dto = plainToInstance(DtoClass, data);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const errorMessage = errors
          .map((err) => Object.values(err.constraints))
          .flat();

        const validationError = errorMessage[0];

        if (validationError) {
          client?.emit('botError', validationError);
        }
      }
      return null; // Indicates validation success
    } catch (error) {
      client?.emit('botError', error?.message);
    }
  }
}
