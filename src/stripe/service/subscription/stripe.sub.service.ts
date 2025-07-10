import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  ListSubArgs,
  StripeSubDto,
  UpdateStripeSubDto,
} from '../../dto/stripe.sub.input';
import { StripePaymentService } from '../stripe.payment.service';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import {
  AppType,
  IntervalType,
  ListSubType,
  PlanIntervalType,
} from '../../enum/sub.plan.enum';
import {
  clinExStarterPlan,
  premiumPlan,
  proPlan,
  slidePremiumPlan,
  slideProPlan,
  slideStarterPlan,
  starterPlan,
} from 'src/user/constant/user.constant';
import { UserDocument } from 'src/user/entity/user.entity';
import { StripeCustomerService } from '../stripe.customer.service';
import { getStripeCusField } from 'src/utilities/service/helpers.service';
import { length } from 'class-validator';

@Injectable()
export class StripeSubService {
  private stripe: Stripe;

  constructor(
    private readonly stripePaymentService: StripePaymentService,
    private readonly stripeCustomerService: StripeCustomerService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2024-06-20',
      },
    );
  }

  // Make subscription plan
  async createSubscription(
    user: UserDocument,
    stripeSubDto: StripeSubDto,
    app?: AppType,
  ): Promise<UserDocument> {
    try {
      let userCustomer = user;

      const { productPriceId, defaultPaymentMethod } = stripeSubDto;
      const { email } = userCustomer;

      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      // Create customer if not exist
      if (!userCustomer?.[stripeCusField]) {
        const createdCustomer = await this.stripeCustomerService.createCustomer(
          {
            email,
            app,
          },
          userCustomer,
        );

        userCustomer = createdCustomer;
      }

      const stripeCustomer = userCustomer?.[stripeCusField];
      const { firstName } = userCustomer;

      if (!stripeCustomer?.defaultPaymentMethod && !defaultPaymentMethod) {
        throw new NotAcceptableException('Default Payment Method is required!');
      }

      // Check if customer already subscribes to this product
      const { data } = await this.listAllSubscriptions(userCustomer, {
        app,
        limit: 1,
      });

      const status = data?.data[0]?.status;
      const subStatus = ['active', 'incomplete', 'trialing'];

      if (data?.data?.length && subStatus.includes(status)) {
        throw new BadRequestException(
          'An active or incomplete subscription already exists for this customer. Please use the upgrade path instead.',
        );
      }
      // Attach and set the default payment method
      if (defaultPaymentMethod) {
        const { id: paymentMethodId } =
          await this.stripePaymentService.attachPaymentMethod(
            userCustomer,
            defaultPaymentMethod,
            app,
          );

        await this.stripeCustomerService.setDefaultPaymentMethod(
          userCustomer,
          paymentMethodId,
          app,
        );
      }

      const { productName, chargeInterval } =
        app === AppType.MEDSCROLL_SLIDE
          ? this.getSlideProductName(productPriceId)
          : this.getProductName(productPriceId);

      const createSubPayload: Stripe.SubscriptionCreateParams = {
        customer: stripeCustomer?.stripeCustomerId,
        default_payment_method:
          stripeCustomer?.defaultPaymentMethod || defaultPaymentMethod,
        items: [
          {
            price: productPriceId,
          },
        ],
        metadata: {
          app:
            app === AppType.MEDSCROLL_SLIDE
              ? AppType.MEDSCROLL_SLIDE
              : AppType.MEDSCROLL,
          name: `${firstName}`,
          email,
        },
      };

      if (!userCustomer?.hasSubscribed || !userCustomer?.hasSubSlide) {
        const hasTrialPeriod =
          app === AppType.MEDSCROLL_SLIDE
            ? userCustomer?.hasSubSlide
            : userCustomer?.hasSubscribed;

        if (!hasTrialPeriod) {
          createSubPayload['trial_period_days'] = 7;
        }
      }

      // Create subscription for the customer
      const createSub = await this.stripe.subscriptions.create(
        createSubPayload,
      );

      if (!createSub) {
        throw new RequestTimeoutException('Error creating subscription');
      }

      stripeCustomer.stripeSub = {
        stripeSubId: createSub?.id,
        stripeSubItemId: createSub?.items?.data[0]?.id,
        stripeSubStatus: createSub?.status,
        stripeSubPlanName: productName,
        chargeInterval,
        cancelAtPeriodEnd: createSub?.cancel_at_period_end,
      };
      stripeCustomer.updatedAt = new Date();

      // Update user subscription details
      app === AppType.MEDSCROLL_SLIDE
        ? await this.updateUserSlideSub(
            createSub?.status,
            productName,
            userCustomer,
          )
        : await this.updateUserSub(
            createSub?.status,
            productName,
            userCustomer,
            chargeInterval,
          );

      app === AppType.MEDSCROLL_SLIDE
        ? (userCustomer.hasSubSlide = true)
        : (userCustomer.hasSubscribed = true);

      userCustomer.markModified(stripeCusField);
      await userCustomer.save();

      return userCustomer;
    } catch (error) {
      if (error?.code === 'resource_missing') {
        throw new BadRequestException('Credit card not set up');
      }
      throw new BadRequestException(error.message);
    }
  }

  // Update subscription plan
  async updateSubscription(
    user: UserDocument,
    updateStripeSubDto: UpdateStripeSubDto,
    app?: AppType,
  ): Promise<UserDocument> {
    try {
      const {
        trialEnd,
        subscriptionId,
        productPriceId,
        cancelAtPeriodEnd,
        defaultPaymentMethod,
        subscriptionItemsId,
      } = updateStripeSubDto;

      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = user?.[stripeCusField];

      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException(
          `Customer has not subscribed to any plan for ${app}.`,
        );
      }

      // If productPriceId is provided, subscriptionItemsId must also be provided and vice versa
      if (!!productPriceId != !!subscriptionItemsId) {
        throw new NotAcceptableException(
          'Both productPriceId and subscriptionItemsId must be provided together.',
        );
      }

      let productName: SubPlanType;
      let chargeInterval: IntervalType;

      if (productPriceId) {
        const { productName: product, chargeInterval: interval } =
          app === AppType.MEDSCROLL_SLIDE
            ? this.getSlideProductName(productPriceId)
            : this.getProductName(productPriceId);

        productName = product;
        chargeInterval = interval;
      }

      const updateSubPayload: Stripe.SubscriptionUpdateParams = {
        cancel_at_period_end: cancelAtPeriodEnd || false,
      };

      if (defaultPaymentMethod) {
        updateSubPayload['default_payment_method'] = defaultPaymentMethod;
      }

      if (subscriptionItemsId) {
        updateSubPayload['items'] = [
          {
            id: subscriptionItemsId,
            price: productPriceId,
          },
        ];
      }

      if (trialEnd) {
        updateSubPayload['trial_end'] = trialEnd; // To instantly end the trial period and charge customer
      }

      // Attach and set the default payment method
      if (defaultPaymentMethod) {
        await this.stripePaymentService.attachPaymentMethod(
          user,
          defaultPaymentMethod,
          app,
        );

        await this.stripeCustomerService.setDefaultPaymentMethod(
          user,
          defaultPaymentMethod,
          app,
        );
      }

      // Update subscription
      const updateSub = await this.stripe.subscriptions.update(
        subscriptionId,
        updateSubPayload,
      );

      if (!updateSub) {
        throw new RequestTimeoutException('Error updating subscription');
      }

      // Update stripe customer subscription details
      stripeCustomer.stripeSub = {
        stripeSubId: updateSub?.id,
        stripeSubItemId: subscriptionItemsId,
        stripeSubStatus: updateSub?.status,
        stripeSubPlanName:
          productName || stripeCustomer?.stripeSub?.stripeSubPlanName,
        chargeInterval:
          chargeInterval || stripeCustomer?.stripeSub?.chargeInterval,
        cancelAtPeriodEnd: updateSub.cancel_at_period_end,
      };
      stripeCustomer.updatedAt = new Date();

      if (productName) {
        // Update user subscription details
        app === AppType.MEDSCROLL_SLIDE
          ? await this.updateUserSlideSub(updateSub?.status, productName, user)
          : await this.updateUserSub(
              updateSub?.status,
              productName,
              user,
              chargeInterval,
            );
      }

      user.markModified(stripeCusField);
      await user.save();

      return user;
    } catch (error) {
      if (error?.code === 'resource_missing') {
        throw new BadRequestException('Credit card not set up');
      }
      throw new BadRequestException(error.message);
    }
  }

  // Cancel subscription plan
  async cancelSubscription(
    userCustomer: UserDocument,
    subscriptionId: string,
    app?: AppType,
  ): Promise<UserDocument> {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException('Customer is not created!');
      }

      const cancelSub = await this.stripe.subscriptions.cancel(subscriptionId);

      if (cancelSub.status === 'canceled') {
        stripeCustomer.stripeSub.stripeSubStatus = 'canceled';
        stripeCustomer.updatedAt = new Date();
      }

      // Conditional logic based on appType
      if (app === AppType.MEDSCROLL_SLIDE) {
        userCustomer.slideSub = {
          ...slideStarterPlan,
          topUpCredits: userCustomer?.slideSub?.topUpCredits ?? 0,
          tokenBalance: userCustomer?.slideSub?.topUpCredits ?? 0,
        };
      } else if (app === AppType.MEDSCROLL_CLINICAL_EXAMS) {
        userCustomer.clinExSub = {
          ...clinExStarterPlan,
          topUpCredits: userCustomer?.subscription?.topUpCredits ?? 0,
          tokenBalance: userCustomer?.subscription?.tokenBalance ?? 0,
        };
      } else {
        userCustomer.subscription = {
          ...starterPlan,
          topUpCredits: userCustomer?.subscription?.topUpCredits ?? 0,
          tokenBalance: userCustomer?.subscription?.tokenBalance ?? 0,
        };
      }

      // Mark subscription and related fields as modified
      userCustomer.markModified('slideSub');
      userCustomer.markModified('subscription');
      userCustomer.markModified('clinExSub');
      userCustomer.markModified(stripeCusField);
      await userCustomer.save();

      return userCustomer;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List all subscriptions by a stripe customer
  async listAllSubscriptions(
    userCustomer: UserDocument,
    listSubArgs: ListSubArgs,
  ) {
    try {
      const { app, productPriceId, status, limit } = listSubArgs;

      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException(
          'Customer has not subscribed to any plan.',
        );
      }

      const payload = {
        customer: stripeCustomer.stripeCustomerId,
        expand: ['data.latest_invoice', 'data.latest_invoice.payment_intent'],
      };

      if (productPriceId) {
        payload['price'] = productPriceId;
      }

      if (limit) {
        payload['limit'] = limit;
      }

      if (status) {
        payload['status'] = status;
      }

      const listSubscription = await this.stripe.subscriptions.list(payload);

      return { data: listSubscription };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Retrieve a subscription from stripe
  async retrieveSubscription(stripeSubId: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        stripeSubId,
      );

      return subscription;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Retrieve a subscription from stripe
  getProductName(productPriceId: string) {
    try {
      switch (productPriceId) {
        case this.configService.get<string>('STRIPE_PRO_MONTHLY'):
          return {
            productName: SubPlanType.PRO,
            chargeInterval: IntervalType.MONTH,
          };

        case this.configService.get<string>('STRIPE_PRO_YEARLY'):
          return {
            productName: SubPlanType.PRO,
            chargeInterval: IntervalType.YEAR,
          };

        case this.configService.get<string>('STRIPE_PREMIUM_MONTHLY'):
          return {
            productName: SubPlanType.PREMIUM,
            chargeInterval: IntervalType.MONTH,
          };

        case this.configService.get<string>('STRIPE_PREMIUM_YEARLY'):
          return {
            productName: SubPlanType.PREMIUM,
            chargeInterval: IntervalType.YEAR,
          };

        default:
          throw new BadRequestException('Invalid product price/identifier!');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Retrieve a subscription from stripe
  getSlideProductName(productPriceId: string) {
    try {
      switch (productPriceId) {
        case this.configService.get<string>('STRIPE_SLIDE_PRO_MONTHLY'):
          return {
            productName: SubPlanType.PRO,
            chargeInterval: IntervalType.MONTH,
          };

        case this.configService.get<string>('STRIPE_SLIDE_PREMIUM_MONTHLY'):
          return {
            productName: SubPlanType.PREMIUM,
            chargeInterval: IntervalType.MONTH,
          };

        default:
          throw new BadRequestException('Invalid product price/identifier!');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update user's subscription object
  async updateUserSub(
    subStatus: string,
    productName: SubPlanType,
    userCustomer: UserDocument,
    chargeInterval: IntervalType,
  ) {
    if (productName === SubPlanType.PREMIUM) {
      userCustomer.subscription = {
        ...premiumPlan,
        productId:
          chargeInterval == IntervalType.MONTH
            ? PlanIntervalType.PREMIUM_MONTH
            : PlanIntervalType.PREMIUM_YEAR,
        identifier:
          chargeInterval == IntervalType.MONTH
            ? SubPlanType.SUB_PLAN_MONTH
            : SubPlanType.SUB_PLAN_YEAR,
        isTrialPeriod:
          subStatus === 'trialing' && !userCustomer?.hasSubscribed
            ? true
            : false,
        isActive:
          subStatus !== 'trialing' && subStatus !== 'active' ? false : true,
        subCredits:
          subStatus === 'trialing' && !userCustomer?.hasSubscribed
            ? 50000
            : premiumPlan.subCredits,
      };
    } else if (productName === SubPlanType.PRO) {
      userCustomer.subscription = {
        ...proPlan,
        productId:
          chargeInterval == IntervalType.MONTH
            ? PlanIntervalType.PRO_MONTH
            : PlanIntervalType.PRO_YEAR,
        identifier:
          chargeInterval == IntervalType.MONTH
            ? SubPlanType.SUB_PLAN_MONTH
            : SubPlanType.SUB_PLAN_YEAR,
        isTrialPeriod:
          subStatus === 'trialing' && !userCustomer?.hasSubscribed
            ? true
            : false,
        isActive:
          subStatus !== 'trialing' && subStatus !== 'active' ? false : true,
        subCredits:
          subStatus === 'trialing' && !userCustomer?.hasSubscribed
            ? 50000
            : proPlan.subCredits,
      };
    }

    // Update topUpCredits
    userCustomer.subscription.topUpCredits =
      userCustomer.subscription.topUpCredits || 0;

    // update tokenBalance
    userCustomer.subscription.tokenBalance =
      userCustomer.subscription.topUpCredits +
      (userCustomer.subscription.subCredits || 0);

    // Mark subscription and usedResources modified
    userCustomer.markModified('subscription');
  }

  // Update user's subscription object
  async updateUserSlideSub(
    subStatus: string,
    productName: SubPlanType,
    user: UserDocument,
  ) {
    switch (productName) {
      case SubPlanType.PREMIUM:
        user.slideSub = {
          ...slidePremiumPlan,
          isActive: subStatus === 'active' ? true : false,
        };
        break;

      case SubPlanType.PRO:
        user.slideSub = {
          ...slideProPlan,
          isActive: subStatus === 'active' ? true : false,
        };
        break;

      default:
        throw new Error(`Unsupported subscription plan: ${productName}`);
    }

    // update topUpCredits
    user.slideSub.topUpCredits = user?.slideSub?.topUpCredits || 0;

    // update tokenBalance
    user.slideSub.tokenBalance =
      user.slideSub.topUpCredits + (user.slideSub.subCredits || 0);

    user.markModified('slideSub'); // Mark slideSub modified
  }
}
