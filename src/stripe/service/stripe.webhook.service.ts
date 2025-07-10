import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/service/user.service';
import Stripe from 'stripe';
import { StripePaymentService } from './stripe.payment.service';
import {
  StripeWebhookDto,
  UpdateStripeWebhookDto,
} from '../dto/stripe.webhook.input';
import {
  AppType,
  ClinExIntervalType,
  IntervalType,
} from '../enum/sub.plan.enum';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { StripeSubService } from './subscription/stripe.sub.service';
import { DataRes } from '../types/stripe.types';
import {
  clinExStarterPlan,
  slideStarterPlan,
  starterPlan,
} from 'src/user/constant/user.constant';
import { getStripeCusField } from 'src/utilities/service/helpers.service';
import { StripeClinExSubService } from './subscription/stripe.clinEx.sub.service';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;
  private readonly webhookSecret = this.configService.get<string>(
    'STRIPE_WEBHOOK_SECRET',
  );

  constructor(
    private readonly userService: UserService,
    private readonly stripePaymentService: StripePaymentService,
    private readonly stripeSubService: StripeSubService,
    private readonly StripeClinExSubService: StripeClinExSubService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2024-06-20',
      },
    );
  }

  // Create webhook endpoint
  async createWebhookEndpoint(
    stripeWebhookDto: StripeWebhookDto,
  ): Promise<DataRes> {
    try {
      const webhookEndpoint = await this.stripe.webhookEndpoints.create(
        stripeWebhookDto,
      );

      return { data: webhookEndpoint };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update webhook endpoint
  async updateWebhookEndpoint(
    updateStripeWebhookDto: UpdateStripeWebhookDto,
  ): Promise<DataRes> {
    try {
      const { webhooId, ...rest } = updateStripeWebhookDto;
      const updateWebhookEndpoint = await this.stripe.webhookEndpoints.update(
        webhooId,
        rest,
      );

      return { data: updateWebhookEndpoint };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List webhook endpoint
  async listWebhookEndpoint(): Promise<DataRes> {
    try {
      const webhookEndpoints = await this.stripe.webhookEndpoints.list({
        limit: 10,
      });

      return { data: webhookEndpoints?.data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete webhook endpoint
  async deleteWebhookEndpoint(webhooId: string): Promise<DataRes> {
    try {
      const webhookEndpoint = await this.stripe.webhookEndpoints.del(webhooId);

      return { data: webhookEndpoint };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Construct event from webhook payload
  async constructEventFromPayload(signature: string, payload: Buffer) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event?.data?.object as Stripe.PaymentIntent;
          const paymentEventId = event?.id;

          await this.updateCustomerPayment(paymentEventId, paymentIntent);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.resumed':
        case 'customer.subscription.updated':
          const subActive = event?.data?.object as Stripe.Subscription;
          const subActiveEventId = event?.id;

          await this.updateUserActiveSub(subActiveEventId, subActive);
          break;

        case 'customer.subscription.deleted':
        case 'customer.subscription.paused':
          const subInactive = event?.data?.object as Stripe.Subscription;
          const subInactiveEventId = event?.id;

          await this.updateUserInactiveSub(subInactiveEventId, subInactive);
          break;

        default:
          break;
      }

      return;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update user payment
  async updateCustomerPayment(
    paymentEventId: string,
    paymentIntent: Stripe.PaymentIntent,
  ) {
    try {
      const {
        receipt_email: email,
        id: paymentId,
        metadata: { app },
      } = paymentIntent;

      if (!email || !app || app === AppType.LOOPSCRIBE) return;

      const user = await this.userService.getUserByEmail(email, app as AppType);

      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app as AppType);

      const stripeCustomer = user?.[stripeCusField];

      if (stripeCustomer.stripeEventsId?.includes(paymentEventId)) return;

      await this.stripePaymentService.verifyStripePayment(
        paymentId,
        paymentIntent,
        user,
      );

      // user.stripeCustomer.stripeEventsId.unshift(paymentEventId);
      stripeCustomer.stripeEventsId.unshift(paymentEventId);

      // Mark stripeCustomer field as modify
      user.markModified(stripeCusField);
      await user.save();

      return;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  // Update user active subscription
  async updateUserActiveSub(
    eventId: string,
    subscription: Stripe.Subscription,
  ) {
    try {
      const {
        id: subId,
        items,
        status,
        cancel_at_period_end,
        metadata: { email, app },
      } = subscription;

      if (!email || !app || app === AppType.LOOPSCRIBE) return;

      const user = await this.userService.getUserByEmail(email, app as AppType);
      if (!user) return;

      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app as AppType);

      if (user?.[stripeCusField]?.stripeEventsId?.includes(eventId)) return;

      const productPlan = items?.data[0]?.plan?.id;

      let planName: SubPlanType;
      let chargeInterval: IntervalType | ClinExIntervalType =
        IntervalType.MONTH;

      if (app === AppType.MEDSCROLL) {
        switch (productPlan) {
          case this.configService.get<string>('STRIPE_PRO_MONTHLY'):
          case this.configService.get<string>('STRIPE_PRO_YEARLY'):
            planName = SubPlanType.PRO;
            chargeInterval =
              productPlan ===
              this.configService.get<string>('STRIPE_PRO_MONTHLY')
                ? IntervalType.MONTH
                : IntervalType.YEAR;
            break;

          case this.configService.get<string>('STRIPE_PREMIUM_MONTHLY'):
          case this.configService.get<string>('STRIPE_PREMIUM_YEARLY'):
            planName = SubPlanType.PREMIUM;
            chargeInterval =
              productPlan ===
              this.configService.get<string>('STRIPE_PREMIUM_MONTHLY')
                ? IntervalType.MONTH
                : IntervalType.YEAR;
            break;

          default:
            return;
        }
      } else if (app === AppType.MEDSCROLL_SLIDE) {
        switch (productPlan) {
          case this.configService.get<string>('STRIPE_SLIDE_PRO_MONTHLY'):
            planName = SubPlanType.PRO;
            break;

          case this.configService.get<string>('STRIPE_SLIDE_PREMIUM_MONTHLY'):
            planName = SubPlanType.PREMIUM;
            break;

          default:
            return;
        }
      } else if (app === AppType.MEDSCROLL_CLINICAL_EXAMS) {
        switch (productPlan) {
          case this.configService.get<string>('STRIPE_ClINEX_PRO_MONTHLY'):
          case this.configService.get<string>('STRIPE_ClINEX_PRO_FOUR_MONTHS'):
            planName = SubPlanType.PRO;
            chargeInterval =
              productPlan ===
              this.configService.get<string>('STRIPE_ClINEX_PRO_MONTHLY')
                ? ClinExIntervalType.MONTH
                : ClinExIntervalType.FOURMONTHS;
            break;

          case this.configService.get<string>('STRIPE_ClINEX_PREMIUM_MONTHLY'):
          case this.configService.get<string>(
            'STRIPE_ClINEX_PREMIUM_FOUR_MONTHS',
          ):
            planName = SubPlanType.PREMIUM;
            chargeInterval =
              productPlan ===
              this.configService.get<string>('STRIPE_ClINEX_PREMIUM_MONTHLY')
                ? ClinExIntervalType.MONTH
                : ClinExIntervalType.FOURMONTHS;
            break;

          default:
            return;
        }
      }

      // Update stripe customer object dynamically
      const stripeCustomer = user?.[stripeCusField];
      stripeCustomer.stripeSub.stripeSubId =
        stripeCustomer.stripeSub.stripeSubId || subId;
      stripeCustomer.stripeSub.stripeSubItemId = items?.data[0]?.id;
      stripeCustomer.stripeSub.stripeSubPlanName = planName;
      stripeCustomer.stripeSub.chargeInterval = chargeInterval;
      stripeCustomer.stripeSub.stripeSubStatus = status;
      stripeCustomer.stripeSub.cancelAtPeriodEnd = cancel_at_period_end;
      stripeCustomer.stripeEventsId.unshift(eventId);
      stripeCustomer.updatedAt = new Date();

      // Update user subscription details
      app === AppType.MEDSCROLL_SLIDE
        ? await this.stripeSubService.updateUserSlideSub(status, planName, user)
        : AppType.MEDSCROLL_CLINICAL_EXAMS
        ? await this.StripeClinExSubService.updateUserClinExSub(
            status,
            planName,
            user,
            chargeInterval as ClinExIntervalType,
          )
        : await this.stripeSubService.updateUserSub(
            status,
            planName,
            user,
            chargeInterval as IntervalType,
          );

      // Mark subscription as modified
      user.markModified(stripeCusField);
      await user.save();

      return;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update user inactive subscription
  async updateUserInactiveSub(
    eventId: string,
    subscription: Stripe.Subscription,
  ) {
    try {
      const {
        metadata: { email, app },
      } = subscription;

      if (!email || !app || app === AppType.LOOPSCRIBE) return;

      const user = await this.userService.getUserByEmail(email, app as AppType);
      if (!user) return;

      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app as AppType);

      const stripeCustomer = user?.[stripeCusField];

      if (stripeCustomer?.stripeEventsId?.includes(eventId)) return;

      if (subscription.status === 'canceled') {
        stripeCustomer.stripeSub.stripeSubStatus = 'canceled';
        stripeCustomer.updatedAt = new Date();
      }

      // Conditional logic based on appType
      if (app === AppType.MEDSCROLL_SLIDE) {
        user.slideSub = {
          ...slideStarterPlan,
          topUpCredits: user?.slideSub?.topUpCredits || 0,
          tokenBalance: user?.slideSub?.topUpCredits || 0,
        };
      } else if (app === AppType.MEDSCROLL_CLINICAL_EXAMS) {
        user.clinExSub = {
          ...clinExStarterPlan,
          topUpCredits: user?.subscription?.topUpCredits || 0,
          tokenBalance: user?.subscription?.topUpCredits || 0,
        };
      } else {
        user.subscription = {
          ...starterPlan,
          topUpCredits: user?.subscription?.topUpCredits || 0,
          tokenBalance: user?.subscription?.topUpCredits || 0,
        };
      }

      // Update stripe customer events
      user[stripeCusField].stripeEventsId.unshift(eventId);

      // Mark subscription and related fields as modified
      user.markModified('slideSub');
      user.markModified('subscription');
      user.markModified('clinExSub');
      user.markModified(stripeCusField);
      await user.save();

      return;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
