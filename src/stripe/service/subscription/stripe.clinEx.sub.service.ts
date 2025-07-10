import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import {
  clinExPremiumPlan,
  clinExProPlan,
} from 'src/user/constant/user.constant';
import { UserDocument } from 'src/user/entity/user.entity';
import { StripePaymentService } from '../stripe.payment.service';
import { StripeCustomerService } from '../stripe.customer.service';
import { StripeSubService } from './stripe.sub.service';
import {
  StripeSubDto,
  UpdateStripeSubDto,
} from 'src/stripe/dto/stripe.sub.input';
import { AppType, ClinExIntervalType } from 'src/stripe/enum/sub.plan.enum';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';

@Injectable()
export class StripeClinExSubService {
  private stripe: Stripe;

  constructor(
    private readonly stripePaymentService: StripePaymentService,
    private readonly stripeCustomerService: StripeCustomerService,
    private readonly StripeSubService: StripeSubService,
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
  async createClinExSub(
    user: UserDocument,
    stripeSubDto: StripeSubDto,
  ): Promise<UserDocument> {
    try {
      let userCustomer = user;

      const { productPriceId, defaultPaymentMethod } = stripeSubDto;
      const { email } = userCustomer;

      // Create customer if not exist
      if (!userCustomer?.stripeClinExCust) {
        const createdCustomer = await this.stripeCustomerService.createCustomer(
          {
            email,
            app: AppType.MEDSCROLL_CLINICAL_EXAMS,
          },
          userCustomer,
        );

        userCustomer = createdCustomer;
      }

      const stripeCustomer = userCustomer?.stripeClinExCust;

      const { firstName } = userCustomer;

      if (!stripeCustomer?.defaultPaymentMethod && !defaultPaymentMethod) {
        throw new NotAcceptableException('Default Payment Method is required!');
      }

      // Check if customer already subscribes to this product
      const { data } = await this.StripeSubService.listAllSubscriptions(
        userCustomer,
        {
          app: AppType.MEDSCROLL_CLINICAL_EXAMS,
          limit: 1,
        },
      );

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
            AppType.MEDSCROLL_CLINICAL_EXAMS,
          );

        await this.stripeCustomerService.setDefaultPaymentMethod(
          userCustomer,
          paymentMethodId,
          AppType.MEDSCROLL_CLINICAL_EXAMS,
        );
      }

      const { productName, chargeInterval } =
        this.getClinExProdName(productPriceId);

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
          app: AppType.MEDSCROLL_CLINICAL_EXAMS,
          name: `${firstName}`,
          email,
        },
      };

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
      await this.updateUserClinExSub(
        createSub?.status,
        productName,
        userCustomer,
        chargeInterval,
      );

      userCustomer.markModified('stripeClinExCust');
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
  async updateClinExSub(
    user: UserDocument,
    updateStripeSubDto: UpdateStripeSubDto,
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

      const stripeCustomer = user?.stripeClinExCust;

      if (!stripeCustomer) {
        throw new BadRequestException(
          `Customer has not subscribed to any plan.`,
        );
      }

      // If productPriceId is provided, subscriptionItemsId must also be provided and vice versa
      if (!!productPriceId != !!subscriptionItemsId) {
        throw new NotAcceptableException(
          'Both productPriceId and subscriptionItemsId must be provided together.',
        );
      }

      let productName: SubPlanType;
      let chargeInterval: ClinExIntervalType;

      if (productPriceId) {
        const { productName: product, chargeInterval: interval } =
          this.getClinExProdName(productPriceId);

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
          AppType.MEDSCROLL_CLINICAL_EXAMS,
        );

        await this.stripeCustomerService.setDefaultPaymentMethod(
          user,
          defaultPaymentMethod,
          AppType.MEDSCROLL_CLINICAL_EXAMS,
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
        await this.updateUserClinExSub(
          updateSub?.status,
          productName,
          user,
          chargeInterval,
        );
      }

      user.markModified('stripeClinExCust');
      await user.save();

      return user;
    } catch (error) {
      if (error?.code === 'resource_missing') {
        console.log(error.message);
        throw new BadRequestException('Credit card not set up');
      }
      throw new BadRequestException(error.message);
    }
  }

  // Retrieve a subscription from stripe
  getClinExProdName(productPriceId: string) {
    try {
      switch (productPriceId) {
        case this.configService.get<string>('STRIPE_ClINEX_PRO_MONTHLY'):
          return {
            productName: SubPlanType.PRO,
            chargeInterval: ClinExIntervalType.MONTH,
          };

        case this.configService.get<string>('STRIPE_ClINEX_PRO_FOUR_MONTHS'):
          return {
            productName: SubPlanType.PRO,
            chargeInterval: ClinExIntervalType.FOURMONTHS,
          };

        case this.configService.get<string>('STRIPE_ClINEX_PREMIUM_MONTHLY'):
          return {
            productName: SubPlanType.PREMIUM,
            chargeInterval: ClinExIntervalType.MONTH,
          };

        case this.configService.get<string>(
          'STRIPE_ClINEX_PREMIUM_FOUR_MONTHS',
        ):
          return {
            productName: SubPlanType.PREMIUM,
            chargeInterval: ClinExIntervalType.FOURMONTHS,
          };

        default:
          throw new BadRequestException('Invalid product price/identifier!');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update user's subscription object
  async updateUserClinExSub(
    subStatus: string,
    productName: SubPlanType,
    user: UserDocument,
    chargeInterval: ClinExIntervalType,
  ) {
    switch (productName) {
      case SubPlanType.PREMIUM:
        const premTopUpCredits = user?.clinExSub?.topUpCredits;

        user.clinExSub = {
          ...clinExPremiumPlan,
          isActive: subStatus === 'active' ? true : false,
          topUpCredits: premTopUpCredits || 0,
          subCredits:
            chargeInterval === ClinExIntervalType.FOURMONTHS
              ? 18000000
              : clinExPremiumPlan.subCredits,
        };
        break;

      case SubPlanType.PRO:
        const proTopUpCredits = user?.clinExSub?.topUpCredits;

        user.clinExSub = {
          ...clinExProPlan,
          isActive: subStatus === 'active' ? true : false,
          topUpCredits: proTopUpCredits || 0,
          subCredits:
            chargeInterval === ClinExIntervalType.FOURMONTHS
              ? 9000000
              : clinExProPlan.subCredits,
        };
        break;

      default:
        throw new Error(`Unsupported subscription plan: ${productName}`);
    }

    // update tokenBalance
    user.clinExSub.tokenBalance =
      user.clinExSub.topUpCredits + (user.clinExSub.subCredits || 0);

    user.markModified('clinExSub'); // Mark clinExSub modified
  }
}
