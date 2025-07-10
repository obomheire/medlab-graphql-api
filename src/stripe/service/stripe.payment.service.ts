import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  AppType,
  CancelSubType,
  StripeCurrencyType,
} from '../enum/sub.plan.enum';
import { UserService } from 'src/user/service/user.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { UserDocument } from 'src/user/entity/user.entity';
import {
  PaymentIntRes,
  PaymentMethodRes,
  PaymentRes,
  RetrieveSetupIntRes,
  SetupIntRes,
} from '../types/stripe.types';
import { StripeCustomerService } from './stripe.customer.service';
import { getStripeCusField } from 'src/utilities/service/helpers.service';

@Injectable()
export class StripePaymentService {
  private stripe: Stripe;

  constructor(
    private readonly stripeCustomerService: StripeCustomerService,
    private readonly userService: UserService,
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2024-06-20',
      },
    );
  }

  // Setup and save credit card without making a payment (Add payment method)
  async createSetupIntent(
    userCustomer: UserDocument,
    paymentMethodId: string,
    app?: AppType,
  ): Promise<SetupIntRes> {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      // Check if Stripe customer exists
      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException(
          'Customer has not subscribed to any plan.',
        );
      }

      const setupIntent = await this.stripe.setupIntents.create({
        customer: stripeCustomer?.stripeCustomerId,
        payment_method: paymentMethodId,
        metadata: {
          app:
            app === AppType.MEDSCROLL_SLIDE
              ? AppType.MEDSCROLL_SLIDE
              : app === AppType.MEDSCROLL_CLINICAL_EXAMS
              ? AppType.MEDSCROLL_CLINICAL_EXAMS
              : AppType.MEDSCROLL,
        },
        // confirm: true, // Use the client_secret key to confirm payment setup in the frontend
      });

      if (!setupIntent) {
        throw new BadRequestException('Something went wrong!');
      }

      const { id, client_secret, status } = setupIntent;

      return { id, client_secret, status };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Confirm setup and save credit card without making a payment (Add payment method)
  async confirmSetupIntent(
    setupIntentId: string,
    paymentMethodId: string,
  ): Promise<SetupIntRes> {
    try {
      const confirmSetupIntent = await this.stripe.setupIntents.confirm(
        setupIntentId,
        {
          payment_method: paymentMethodId,
        },
      );

      if (!confirmSetupIntent)
        throw new BadRequestException('Something went wrong!');

      const { id, client_secret, status } = confirmSetupIntent;

      return { id, client_secret, status };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update a save credit card without making a payment (Add payment method)
  async updateSetupIntent(setupIntentId: string, paymentMethodId: string) {
    try {
      const updateSetupIntent = await this.stripe.setupIntents.update(
        setupIntentId,
        {
          payment_method: paymentMethodId,
          // confirm: true, // Use the client_secret key to confirm payment setup in the frontend
        },
      );

      if (!updateSetupIntent)
        throw new BadRequestException('Something went wrong!');

      const { id: setupIntId, client_secret, status } = updateSetupIntent;

      return { setupIntId, client_secret, status };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Cancle a save credit card without making a payment (Add payment method)
  async cancelSetupIntent(setupIntentId: string): Promise<SetupIntRes> {
    try {
      const cancelSetupIntent = await this.stripe.setupIntents.cancel(
        setupIntentId,
      );

      if (!cancelSetupIntent)
        throw new BadRequestException('Something went wrong!');

      const { id, client_secret, status } = cancelSetupIntent;

      return { id, client_secret, status };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List all setup intents added by a Stripe customer for Medscroll or Slide app
  async listAllSetupIntent(
    userCustomer: UserDocument,
    app?: AppType,
  ): Promise<RetrieveSetupIntRes> {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      // Check if Stripe customer exists
      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException(
          'Customer has not subscribed to any plan.',
        );
      }

      const listSetupIntent = await this.stripe.setupIntents.list({
        customer: stripeCustomer?.stripeCustomerId,
      });

      if (!listSetupIntent.data.length) {
        throw new BadRequestException('Setup intent not found');
      }

      return { setupIntent: listSetupIntent?.data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Retrieve a setup intent added by a stripe customer
  async retrieveSetupIntent(
    setupIntentId: string,
  ): Promise<RetrieveSetupIntRes> {
    try {
      const setupIntent = await this.stripe.setupIntents.retrieve(
        setupIntentId,
      );

      if (!setupIntent) throw new BadRequestException('Setup Intent not found');

      return { setupIntent };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Attach payment method
  async attachPaymentMethod(
    userCustomer: UserDocument,
    paymentMethodId: string,
    app?: AppType,
  ) {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException('Customer is not created!');
      }

      const attachPaymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: stripeCustomer.stripeCustomerId },
      );

      if (!attachPaymentMethod) {
        throw new BadRequestException('Error attaching payment method!');
      }

      return attachPaymentMethod;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Detach payment method from a customer
  async detachPaymentMethod(paymentMethodId: string) {
    try {
      const detachePaymentMethod = await this.stripe.paymentMethods.detach(
        paymentMethodId,
      );

      if (!detachePaymentMethod)
        throw new BadRequestException('Error dettaching payment method!');

      return { data: detachePaymentMethod };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List all payment methods added by a Stripe customer for Medscroll or Slide app
  async listAllPaymentMethod(
    userCustomer: UserDocument,
    app?: AppType,
  ): Promise<PaymentMethodRes> {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      // Check if the Stripe customer exists
      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException(
          'Customer has not subscribed to any plan.',
        );
      }

      // Retrieve the list of payment methods for the customer
      const listPaymentMethod = await this.stripe.customers.listPaymentMethods(
        stripeCustomer?.stripeCustomerId,
        {
          type: 'card',
          limit: 10,
        },
      );

      // const listPaymentMethod = await this.stripe.paymentMethods.list({
      //   customer: userCustomer?.stripeCustomer?.stripeCustomerId,
      //   // type: 'card',
      //   limit: 10,
      // });

      if (!listPaymentMethod.data.length) {
        throw new BadRequestException('Payment method not found!');
      }

      return { paymentMethod: listPaymentMethod?.data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Retrieve a payment method added by a Stripe customer for Medscroll or Slide app
  async retrievePaymentMethod(
    userCustomer: UserDocument,
    paymentMethodId: string,
    app?: AppType,
  ): Promise<PaymentMethodRes> {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      // Check if the Stripe customer exists
      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException(
          'Customer has not subscribed to any plan.',
        );
      }

      // Retrieve the specified payment method for the customer
      const paymentMethod = await this.stripe.customers.retrievePaymentMethod(
        stripeCustomer?.stripeCustomerId,
        paymentMethodId,
      );

      if (!paymentMethod) {
        throw new BadRequestException('Payment method not found!');
      }

      return { paymentMethod };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Make stripe payment
  async makePayment(
    email: string,
    tokenNumber: number,
    paymentMethodId: string,
  ): Promise<PaymentRes> {
    try {
      const userCustomer = await this.userService.getUserByEmail(
        email,
        AppType.MEDSCROLL,
      );

      const { stripeCustomer, firstName, lastName } = userCustomer;

      if (!stripeCustomer?.defaultPaymentMethod && !paymentMethodId)
        throw new BadRequestException('Payment method is required');

      const payment = await this.stripe.paymentIntents.create({
        amount: tokenNumber * 2 * 100, // Amount in cent. 1 tokenNumber = 2 AUD
        customer: stripeCustomer.stripeCustomerId,
        payment_method: stripeCustomer?.defaultPaymentMethod || paymentMethodId,
        payment_method_types: ['card'],
        currency: StripeCurrencyType.AUD,
        receipt_email: email,
        metadata: {
          app: AppType.MEDSCROLL,
          name: `${firstName} ${lastName}`,
          email,
          tokenNumber,
          topUpCredits: tokenNumber * 1000000,
        },
        // confirm: true,
      });

      if (!payment) throw new BadRequestException('Something went wrong!');

      stripeCustomer.stripePayment = {
        stripePayId: payment.id,
        stripePayStatus: payment.status,
        amount: payment.amount / 100,
        currency: StripeCurrencyType.AUD,
      };

      stripeCustomer.updatedAt = new Date();

      if (payment.status === 'succeeded') {
        userCustomer.subscription.topUpCredits += tokenNumber * 1000000;

        // update tokenBalance
        userCustomer.subscription.tokenBalance =
          userCustomer.subscription.topUpCredits +
          (userCustomer?.subscription?.subCredits || 0);
      }

      userCustomer.markModified('stripeCustomer');
      userCustomer.markModified('subscription');
      await userCustomer.save();

      const { id, client_secret, status } = payment;

      return { id, client_secret, status };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Make stripe payment
  async slideCreditPayment(
    email: string,
    paymentMethodId: string,
    amount: number,
  ) {
    try {
      let userCustomer = await this.userService.getUserByEmail(email);

      // Create customer if not exist
      if (!userCustomer?.stripeSlideCust) {
        const createdCustomer = await this.stripeCustomerService.createCustomer(
          { email, app: AppType.MEDSCROLL_SLIDE },
          userCustomer,
        );

        userCustomer = createdCustomer;
      }

      const { stripeSlideCust, firstName, lastName } = userCustomer;

      if (!stripeSlideCust?.defaultPaymentMethod && !paymentMethodId)
        throw new BadRequestException('Payment method is required');

      const credits = (amount / 5) * 200000;

      const payment = await this.stripe.paymentIntents.create({
        amount: amount * 100,
        customer: stripeSlideCust.stripeCustomerId,
        payment_method:
          stripeSlideCust?.defaultPaymentMethod || paymentMethodId,
        payment_method_types: ['card'],
        currency: StripeCurrencyType.AUD,
        receipt_email: email,
        metadata: {
          app: AppType.MEDSCROLL_SLIDE,
          name: `${firstName} ${lastName}`,
          email,
          credits,
        },
        // confirm: true,
      });

      if (!payment) throw new BadRequestException('Something went wrong!');

      stripeSlideCust.stripePayment = {
        stripePayId: payment.id,
        stripePayStatus: payment.status,
        amount: payment.amount / 100,
        currency: StripeCurrencyType.AUD,
      };

      stripeSlideCust.updatedAt = new Date();

      if (payment.status === 'succeeded') {
        userCustomer.slideSub.topUpCredits += credits || 0;

        // update tokenBalance
        userCustomer.slideSub.tokenBalance =
          userCustomer.slideSub.topUpCredits +
          (userCustomer?.slideSub?.subCredits || 0);
      }

      userCustomer.markModified('slideSub');
      userCustomer.markModified('stripeSlideCust');
      await userCustomer.save();

      const { id, client_secret, status } = payment;

      return { id, client_secret, status };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Confirm payment (Dev Only)
  async confirmPayment(paymentId: string) {
    try {
      const paymentInt = await this.stripe.paymentIntents.retrieve(paymentId);

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentId,
        {
          payment_method: paymentInt.payment_method as string,
          // return_url: 'https://www.example.com',
        },
      );

      return await this.verifyStripePayment(paymentId, paymentIntent);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Confirm payment for Medscroll or Slide app
  async verifyStripePayment(
    paymentId: string,
    paymentIntent?: Stripe.PaymentIntent,
    user?: UserDocument,
  ) {
    try {
      // Retrieve payment intent if not provided
      const paymentInt =
        paymentIntent || (await this.stripe.paymentIntents.retrieve(paymentId));

      const { status, receipt_email: email, metadata } = paymentInt;
      const { app } = metadata;

      if (!app || app === AppType.LOOPSCRIBE) return;

      if (status === 'succeeded') {
        // Retrieve user if not provided
        const userCustomer =
          user ||
          (await this.userService.getUserByEmail(email, app as AppType));

        // Determine the Stripe customer field dynamically
        const stripeCustomerField =
          app === AppType.MEDSCROLL_SLIDE
            ? 'stripeSlideCust'
            : 'stripeCustomer';

        const stripeCustomer = userCustomer?.[stripeCustomerField];

        // Update payment status and user subscription/credits
        stripeCustomer.stripePayment.stripePayStatus = status;

        switch (app) {
          case AppType.MEDSCROLL_SLIDE:
            userCustomer.slideSub.topUpCredits += +metadata?.credits || 0;

            // update tokenBalance
            userCustomer.slideSub.tokenBalance =
              userCustomer.slideSub.topUpCredits +
              (userCustomer?.slideSub?.subCredits || 0);
            break;

          case AppType.MEDSCROLL:
            userCustomer.subscription.topUpCredits +=
              +metadata?.topUpCredits || 0;

            // update tokenBalance
            userCustomer.subscription.tokenBalance =
              userCustomer.subscription.topUpCredits +
              (userCustomer?.subscription?.subCredits || 0);
            break;

          default:
            return;
        }

        stripeCustomer.updatedAt = new Date();

        // Mark modified fields before saving
        userCustomer.markModified('subscription');
        userCustomer.markModified('slideSub');
        userCustomer.markModified(stripeCustomerField);
        await userCustomer.save();

        return {
          message: 'Payment was successful',
        };
      }

      return {
        message: 'Payment was not successful',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Retrieve a payment a customer's
  async retrievePayment(paymentId: string): Promise<PaymentIntRes> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentId,
      );

      return { paymentIntent };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List all payments made by a Stripe customer for Medscroll or Slide app
  async listAllPayment(
    userCustomer: UserDocument,
    app?: AppType,
  ): Promise<PaymentIntRes> {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      // Check if the Stripe customer exists
      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException(
          'Customer has not subscribed to any plan.',
        );
      }

      // Retrieve all payment intents for the customer
      const retrieveAllPayment = await this.stripe.paymentIntents.list({
        customer: stripeCustomer?.stripeCustomerId,
        limit: 10,
      });

      if (!retrieveAllPayment?.data.length) {
        throw new BadRequestException('No payments found!');
      }

      return { paymentIntent: retrieveAllPayment?.data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Cancle payments maid by a customer
  async cancelPayment(
    paymentId: string,
    cancelReason: CancelSubType,
  ): Promise<PaymentRes> {
    try {
      const cancelPayment = await this.stripe.paymentIntents.cancel(paymentId, {
        cancellation_reason: cancelReason,
      });

      if (!cancelPayment)
        throw new BadRequestException('Error canceling payment!');

      const { id, client_secret, status } = cancelPayment;

      return { id, client_secret, status };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get exchange rate for USD to NGN
  async getExchangeRate() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://cdn.moneyconvert.net/api/latest.json`),
      );

      const { rates } = response.data;

      return { USDtoNGN: rates.NGN };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
