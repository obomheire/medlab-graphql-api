import { Injectable } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/service/auth.service';
import { OnlineUser, SocketUser } from 'src/utilities/interface/interface';
import { UserService } from 'src/user/service/user.service';
import { WebSocketServer, WsException } from '@nestjs/websockets';
import { v4 as uuidv4 } from 'uuid';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GeneralGroupType } from '../env.enum';
import { ChatSimulationMobileService } from 'src/chat-simulation/service/chat-simulation.mobile.service';

@Injectable()
export class WsService {
  public readonly clients: Map<string, OnlineUser> = new Map();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly chatSimulationMobileService: ChatSimulationMobileService,
  ) {}

  // Get client user and validate
  getClientUser(client: Socket): SocketUser {
    const clientUser: SocketUser = client['user'];

    if (!clientUser)
      throw new WsException('Could not find client room or name!');

    return clientUser;
  }

  async handleConnection(client: Socket) {
    try {
      const { userUUID } = await this.validateClient(client);

      // Check if the client is not already connected
      if (!this.clients.has(userUUID)) {
        this.clients.set(userUUID, {
          userUUID,
          clientID: client.id,
          connectedAt: new Date(),
        });
      }

      // Add user to socket
      client['user'] = {
        userUUID,
      } as SocketUser;

      client.join(GeneralGroupType.GENERAL_GROUP);

      const user = await this.userService.getUserByUUID(userUUID);
      await this.userService.resetStreaks(user); // Reset user's streaks if applicable

      client.on('disconnect', async () => await this.handleDisconnect(client));
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      // Get the client entry from the map
      const clientEntry = Array.from(this.clients.entries()).find(
        ([, onlineUser]) => onlineUser.clientID === client.id,
      );

      //  if exist update cummulative hours and daily average & remove client from map
      if (clientEntry) {
        const [userUUID, disconnectedClient] = clientEntry;

        // Remove the client from the map
        this.clients.delete(userUUID);

        // Update the cummulative hours and daily average usage
        await this.userService.updateActiveHours(
          disconnectedClient.userUUID,
          new Date(),
          disconnectedClient.connectedAt,
        );
      }

      return;
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Valiadte input
  async validateInput(DtoClass: any, data: any): Promise<string | null> {
    try {
      const dto = plainToInstance(DtoClass, data);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const errorMessage = errors
          .map((err) => Object.values(err.constraints))
          .flat();

        const validationError = errorMessage[0];

        if (validationError) {
          throw new WsException(validationError);
        }
      }
      return null; // Indicates validation success
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Validate token
  async validateClient(client: Socket) {
    try {
      const authorization =
        client.handshake.auth?.authorization ||
        client.handshake.headers['authorization'] ||
        client.handshake.query.authorization;

      const code =
        client.handshake.auth?.code ||
        client.handshake.headers['code'] ||
        client.handshake.query.code;

      // Validate token
      const token = authorization?.split(' ')[1];
      if (!token) throw new WsException('Token not provided!');

      const { userUUID, firstName, url, plan } =
        await this.authService.verifyToken(token);

      return {
        userUUID,
        firstName,
        code,
        plan,
        url,
      };
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Validate token
  async validateAudience(client: Socket) {
    try {
      let name = '';
      let userUUID = `guest-${uuidv4()}`;
      let url = '';
      let plan = '';
      let category = '';

      const authorization =
        client.handshake.auth?.authorization ||
        client.handshake.headers['authorization'] ||
        client.handshake.query?.authorization;

      const inviteCode =
        client.handshake.auth?.code ||
        client.handshake.headers['code'] ||
        client.handshake.query?.code;

      const clientName =
        client.handshake.auth?.name ||
        client.handshake.headers['name'] ||
        client.handshake.query?.name;

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
          url: profileUrl,
          plan: subPlan,
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
        url = profileUrl;
        plan = subPlan;
      } else {
        name = clientName || 'Audience';
      }

      return { userUUID, name, inviteCode, url, plan, category };
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }
}
