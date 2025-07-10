import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/service/user.service';
import {
  RevcatEventType,
  SubPlanType,
  SubStatusType,
} from '../enum/revenuecat.enum';
import { v4 as uuidv4 } from 'uuid';
import {
  premiumPlan,
  proPlan,
  starterPlan,
} from 'src/user/constant/user.constant';
import { AmplitudeService } from 'src/amplitude/service/amplitude.service';

@Injectable()
export class RevenuecatService {
  private webhookSecret = this.configService.get<string>('RC_WEBHOOK_SECRET');

  constructor(
    private readonly userService: UserService,
    private readonly amplitudeService: AmplitudeService,
    private configService: ConfigService,
  ) {}

  // Revenuecat webhook endpoint
  async revenuecatWebhook(authorization: string, eventPayload: any) {
    try {
      if (!authorization || authorization !== this.webhookSecret)
        throw new UnauthorizedException('Unauthorized request!');

      const {
        event: {
          period_type, // TRIAL or NORMAL
          purchased_at_ms,
          expiration_at_ms,
          type: eventType,
          original_transaction_id: transactionId,
          app_user_id,
          product_id, // "medscroll.pro.monthly"
          presented_offering_id: chargeInterval, // subcription.plan.montly/subcription.plan.yearly
          subscriber_attributes: {
            $email: { value: email },
          },
          id: eventId,
        },
      } = eventPayload;

      const user = await this.userService.getUserByEmail(email);

      // Check if event has already been processed
      if (user?.revenueCart?.revcartEventsId?.includes(eventId)) return;

      // Check for cancellation with non expired subscription
      if (
        eventType === RevcatEventType.CANCELLATION &&
        expiration_at_ms > Date.now()
      )
        return;

      const revcatUpdate = {
        transactionId,
        subStatus: eventType,
        subInterval: chargeInterval,
        purchasedAt: new Date(purchased_at_ms),
        expirationAt: new Date(expiration_at_ms),
        revcartEventsId: user?.revenueCart
          ? [...user?.revenueCart?.revcartEventsId, eventId]
          : [eventId],
        updatedAt: new Date(),
      };

      const productId = product_id.split(':')[0];
      const plan = product_id.split('.')[1];

      // Handle different event types
      switch (eventType) {
        case RevcatEventType.INITIAL_PURCHASE:
        case RevcatEventType.RENEWAL:
        case RevcatEventType.PRODUCT_CHANGE:
          if (plan === SubPlanType.PREMIUM) {
            user.subscription = {
              ...premiumPlan,
              productId,
              identifier: chargeInterval,
              subCredits:
                period_type === 'TRIAL' ? 50000 : premiumPlan.subCredits,
              isTrialPeriod: period_type === 'TRIAL',
            };
          } else if (plan === SubPlanType.PRO) {
            user.subscription = {
              ...proPlan,
              productId,
              identifier: chargeInterval,
              subCredits: period_type === 'TRIAL' ? 50000 : proPlan.subCredits,
              isTrialPeriod: period_type === 'TRIAL',
            };
          }

          user.hasSubscribed = true;

          // Handle sending event to amplitude
          await this.amplitudeService.handleSubscription(
            user.userUUID,
            period_type === 'TRIAL' ? SubStatusType.TRIAL : SubStatusType.PAID,
          );
          break;

        case RevcatEventType.BILLING_ISSUE:
        case RevcatEventType.CANCELLATION:
        case RevcatEventType.EXPIRATION:
        case RevcatEventType.SUBSCRIPTION_PAUSED:
          user.subscription = starterPlan;
          break;

        default:
          return;
      }

      // Set initial values if user doesn't have revenueCart
      if (!user?.revenueCart) {
        revcatUpdate['revcartUUID'] = uuidv4();
        revcatUpdate['revcartCustomeId'] = app_user_id;
        revcatUpdate['createdAt'] = new Date();
      }

      user.revenueCart = {
        ...user?.revenueCart,
        ...revcatUpdate,
      };

      // update topUpCredits
      user.subscription.topUpCredits = user?.subscription?.topUpCredits || 0;

      // update tokenBalance
      user.subscription.tokenBalance =
        user.subscription.topUpCredits + user.subscription.subCredits;

      // Mark subscription, revenueCart as modified
      user.markModified('revenueCart');
      user.markModified('subscription');
      await user.save();
      await this.userService.updateUser(user); // Emit total token balance to user

      return;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
