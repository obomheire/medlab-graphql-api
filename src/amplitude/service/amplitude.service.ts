import { BadGatewayException, Injectable } from '@nestjs/common';
import * as amplitude from '@amplitude/analytics-node';
import { ConfigService } from '@nestjs/config';
import { SubStatusType } from 'src/revenuecat/enum/revenuecat.enum';

@Injectable()
export class AmplitudeService {
  constructor(private configService: ConfigService) {
    amplitude.init(this.configService.get<string>('AMPLITUDE_API_KEY'));
  }

  // Send event to amplitude
  async sendEvent(
    userUUID: string,
    eventType: string,
    eventProperties: Record<string, any> = {},
  ): Promise<void> {
    try {
      amplitude.track({
        event_type: eventType,
        user_id: userUUID,
        event_properties: eventProperties,
      });

      console.log('Event sent to Amplitude:', eventType);
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  // Handle subscription event
  async handleSubscription(userUUID: string, subType: SubStatusType) {
    if (subType === SubStatusType.TRIAL) {
      await this.sendEvent(userUUID, 'Trial User Subscription', {
        plan: SubStatusType.TRIAL,
        status: SubStatusType.ACTIVE,
      });
    } else if (subType === SubStatusType.PAID) {
      await this.sendEvent(userUUID, 'Paid User Subscription', {
        plan: SubStatusType.PAID,
        status: SubStatusType.ACTIVE,
      });
    }
  }
}
