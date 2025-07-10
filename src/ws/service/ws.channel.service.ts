import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketUser } from 'src/utilities/interface/interface';
import { WsException } from '@nestjs/websockets';
import { WsService } from './ws.service';
import { ChatSimulationService } from 'src/chat-simulation/service/chat-simulation.service';
import { ChatSimulationMobileService } from 'src/chat-simulation/service/chat-simulation.mobile.service';

@Injectable()
export class WsChannelService {
  constructor(
    private readonly wsService: WsService,
    private readonly chatSimulationService: ChatSimulationService,
    private readonly chatSimulationMobileService: ChatSimulationMobileService,
  ) {}

  // Get client user and validate
  private getClientUser(client: Socket): SocketUser {
    const clientUser: SocketUser = client['user'];

    if (!clientUser)
      throw new WsException('Could not find client room or name!');

    return clientUser;
  }

  // Handle connection
  async handleConnection(client: Socket) {
    try {
      const { userUUID, firstName, code } = await this.wsService.validateClient(
        client,
      );

      // Check if join code is provided
      if (!code) throw new WsException('Join code is not provided!');

      // Validate inviteCode
      const { eventName, episode: visitedEpisode } =
        await this.chatSimulationService.getEpisodeByJoinCode(code);

      await this.chatSimulationMobileService.saveUserVisitedEventEpisode(
        { eventName, visitedEpisode },
        userUUID,
      );

      client['user'] = {
        userUUID,
        firstName,
        code,
      } as SocketUser;
      client.join(code); // Add audience to the room
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }

  // Handle disconnection
  async handleDisconnect(client: Socket) {
    try {
      client.disconnect();
    } catch (error) {
      client.emit('errorMessage', error.message);
      client.disconnect();
    }
  }
}
