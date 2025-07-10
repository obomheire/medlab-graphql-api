import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketUser } from 'src/utilities/interface/interface';
import { WsException } from '@nestjs/websockets';
import { WsNotificationGateway } from '../gateway/ws.notification.gateway';
import { v4 as uuidv4 } from 'uuid';
import { url } from 'inspector';
import { AuthService } from 'src/auth/service/auth.service';
import { UserService } from 'src/user/service/user.service';

@Injectable()
export class WsNotificationService {
  constructor(
    @Inject(forwardRef(() => WsNotificationGateway))
    private readonly wsNotificationGateway: WsNotificationGateway,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // Get client user and validate
  private getClientUser(client: Socket): SocketUser {
    const clientUser: SocketUser = client['user'];

    if (!clientUser)
      throw new WsException('Could not find client room or name!');

    return clientUser;
  }

  // Handle connection
  async handleConnection(client: Socket, server?: Server) {
    try {
      const { userUUID, name, category } = await this.validateUser(client);

      client['user'] = {
        userUUID,
        name,
        category,
      } as SocketUser;
      client.join(`${userUUID}-slide-notification`); // Add audience to the room
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle disconnection
  async handleDisconnect(client: Socket) {
    try {
      const { userUUID, code } = this.getClientUser(client);

      // Remove audience from quiz
      client.leave(`${userUUID}-slide-notification`);
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  async slideImageGenStatus(userUUID: string, data: any) {
    try {
      this.wsNotificationGateway.server
        .to(`${userUUID}-slide-notification`)
        .emit('SlideImageGenStatus', data);
    } catch (error) {
      this.wsNotificationGateway.server.emit('error', error.message);
    }
  }

  async validateUser(client: Socket) {
    try {
      let name = '';
      let userUUID = `guest-${uuidv4()}`;
      let category = '';

      const authorization =
        client.handshake.auth?.authorization ||
        client.handshake.headers['authorization'] ||
        client.handshake.query?.authorization;

      category =
        client.handshake.auth?.category ||
        client.handshake.headers['category'] ||
        client.handshake.query?.category;

      const token = authorization?.split(' ')[1];

      if (token) {
        const {
          userUUID: audienceUUID,
          firstName,
          lastName,
        } = await this.authService.verifyToken(token);

        name =
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName
            ? firstName
            : lastName
            ? lastName
            : 'Audience';

        userUUID = audienceUUID;
      } else {
        name = 'Audience';
      }

      return { userUUID, name, category };
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }
}
