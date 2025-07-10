import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { WsService } from '../service/ws.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  CreateMessageInput,
  FetchMessagesInput,
  ReplyToMessageInput,
} from '../dto/ws.dto';
import { WsEngagementService } from '../service/ws.engagement.service';
import { EngagementType } from 'src/quiz/enum/engagement.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    credentials: true,
  },
  namespace: 'ws/engagement',
})
export class WsEngagementGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsService.name);

  constructor(
    @Inject(forwardRef(() => WsEngagementService))
    private readonly wsEngagementService: WsEngagementService,
  ) {}

  // Called when the WebSocket gateway has been initialized
  afterInit(server: Server) {
    this.logger.log('WsEngagementGateway initialized');
  }

  // Called when a client connects to the WebSocket server
  async handleConnection(client: Socket) {
    await this.wsEngagementService.handleConnection(client, this.server);
  }

  // Called when a client disconnects from the WebSocket server
  async handleDisconnect(client: Socket) {
    // try {
    //   await this.wsEngagementService.handleDisconnect(client);
    // } catch (error) {
    //   client.emit('errorMessage', error.message);
    //   client.disconnect();
    // }
  }

  @SubscribeMessage('set-mannually-activate-ai-status')
  async setMannuallyActivateAIStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type: EngagementType; status: boolean },
  ) {
    await this.wsEngagementService.setMannuallyActivateAIStatus(
      data.status,
      data.type,
      client,
    );
  }

  @SubscribeMessage('set-presentation-or-episode-ended')
  async setPresentationOrEpisodeEnded(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: boolean },
  ) {
    await this.wsEngagementService.setPresentationOrEpisodeEnded(data.status);
  }

  // Handle message creation
  @SubscribeMessage('create-slide-comment') //used to be create-message
  async createSlideComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageInput,
  ) {
    const response = await this.wsEngagementService.createMessage(
      createMessageDto,
      client,
    );

    if (response) {
      client.emit('createSlideComment', response); //used to be createMessage
    }
  }

  @SubscribeMessage('create-channel-comment') //used to be create-message
  async createChannelComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageInput,
  ) {
    const response = await this.wsEngagementService.createMessage(
      createMessageDto,
      client,
    );

    if (response) {
      client.emit('createChannelComment', response);
    }
  }

  // Handle question message creation
  @SubscribeMessage('create-slide-question') //used to be create-message
  async createSlideQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageInput,
  ) {
    const response = await this.wsEngagementService.createMessage(
      createMessageDto,
      client,
    );

    if (response) {
      client.emit('createSlideQuestion', response); //used to be createMessage
    }
  }

  @SubscribeMessage('create-channel-question') //used to be create-message
  async createChannelQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageInput,
  ) {
    const response = await this.wsEngagementService.createMessage(
      createMessageDto,
      client,
    );

    if (response) {
      client.emit('createChannelQuestion', response);
    }
  }

  // Handle reply to message
  @SubscribeMessage('reply-to-slide-comment') //used to be reply-to-message
  async replyToSlideComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() replyMessageDto: ReplyToMessageInput,
  ) {
    const response = await this.wsEngagementService.replyToMessage(
      replyMessageDto,
      client,
    );
    client.emit('replySlideComment', response); //used to be replyMessage
  }

  @SubscribeMessage('reply-to-channel-comment') //used to be reply-to-message
  async replyToChannelComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() replyMessageDto: ReplyToMessageInput,
  ) {
    const response = await this.wsEngagementService.replyToMessage(
      replyMessageDto,
      client,
    );
    client.emit('replyChannelComment', response); //used to be replyMessage
  }

  // Handle reply to question
  @SubscribeMessage('reply-to-slide-question')
  async replyToSlideQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() replyMessageDto: ReplyToMessageInput,
  ) {
    const response = await this.wsEngagementService.replyToMessage(
      replyMessageDto,
      client,
    );
    client.emit('replySlideQuestion', response); //used to be replyMessage
  }

  @SubscribeMessage('reply-to-channel-question') //used to be reply-to-message
  async replyToChannelQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() replyMessageDto: ReplyToMessageInput,
  ) {
    const response = await this.wsEngagementService.replyToMessage(
      replyMessageDto,
      client,
    );
    client.emit('replyChannelQuestion', response); //used to be replyMessage
  }


  // Handle fetch messages
  @SubscribeMessage('fetch-messages')
  async fetchMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() fetchMessagesDto: FetchMessagesInput,
  ) {
    const response = await this.wsEngagementService.getMessages(
      client,
      fetchMessagesDto.engagementType,
    );
    if (response) {
      client.emit('fetchMessages', response);
    }
  }

  // Handle fetch message by UUID
  @SubscribeMessage('fetch-message-by-uuid')
  async fetchMessageByUUID(
    @ConnectedSocket() client: Socket,
    @MessageBody('commentUUID') commentUUID: string,
  ) {
    const response = await this.wsEngagementService.getMessageByUUID(
      commentUUID,
      client,
    );
    if (response) {
      client.emit('fetchMessageByUUID', response);
    }
  }

  // Handle like message
  @SubscribeMessage('like-message')
  async likeMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody('commentUUID') commentUUID: string,
  ) {
    const response = await this.wsEngagementService.likeMessage(
      commentUUID,
      client,
    );
    if (response) {
      client.emit('likeMessage', response);
    }
  }

  // Handle is typing comment event
  @SubscribeMessage('is-typing-slide-comment') //used to be is-typing-comment
  async isTypingSlideComment(
    @ConnectedSocket() client: Socket,
    @MessageBody('status') status: boolean,
  ) {
    // await this.wsEngagementService.aiComment()
    return await this.wsEngagementService.isTypingComment(
      client,
      this.server,
      status,
    );
  }

  @SubscribeMessage('is-typing-channel-comment')
  async isTypingChannelComment(
    @ConnectedSocket() client: Socket,
    @MessageBody('status') status: boolean,
  ) {
    return await this.wsEngagementService.isTypingComment(
      client,
      this.server,
      status,
    );
  }

  // Handle is typing question event
  @SubscribeMessage('is-typing-slide-question')
  async isTypingSlideQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody('status') status: boolean,
  ) {
    return await this.wsEngagementService.isTypingQuestion(
      client,
      this.server,
      status,
    );
  }

  @SubscribeMessage('is-typing-channel-question')
  async isTypingChannelQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody('status') status: boolean,
  ) {
    return await this.wsEngagementService.isTypingQuestion(
      client,
      this.server,
      status,
    );
  }
}
