import {
  BadRequestException,
  Injectable,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from 'src/user/service/user.service';
import { UserDocument, UserEntity } from 'src/user/entity/user.entity';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { StripeCustomaData } from 'src/user/entity/types.entity';
import {
  clinExStarterPlan,
  slideStarterPlan,
  starterPlan,
} from 'src/user/constant/user.constant';
import { StripeCustomerDto } from 'src/stripe/dto/stripe.customer.input';
import { AppType } from '../enum/sub.plan.enum';
import { getStripeCusField } from 'src/utilities/service/helpers.service';

@Injectable()
export class StripeCustomerService {
  private stripe: Stripe;

  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2024-06-20',
      },
    );
  }

  // Create stripe customer for Medscroll or Slide app
  async createCustomer(
    { email, app }: StripeCustomerDto,
    userCustomer?: UserDocument,
  ): Promise<UserDocument> {
    try {
      let newStripeCustomer: any;

      const user =
        userCustomer || (await this.userService.getUserByEmail(email));

      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      if (!user?.[stripeCusField]) {
        newStripeCustomer = await this.stripe.customers.create({
          name: `${user.firstName} ${user?.lastName}`,
          email: user.email,
          metadata: {
            app:
              app === AppType.MEDSCROLL_SLIDE
                ? AppType.MEDSCROLL_SLIDE
                : app === AppType.MEDSCROLL_CLINICAL_EXAMS
                ? AppType.MEDSCROLL_CLINICAL_EXAMS
                : AppType.MEDSCROLL,
          },
        });

        if (!newStripeCustomer)
          throw new BadRequestException('Error creating customer');

        const stripeCustomer: StripeCustomaData = {
          stripeCustomerUUID: uuidv4(),
          stripeCustomerId: newStripeCustomer.id,
          stripeSub: {
            stripeSubId: null,
            stripeSubItemId: null,
            stripeSubPlanName: SubPlanType.STARTER,
            chargeInterval: null,
            stripeSubStatus: null,
            cancelAtPeriodEnd: null,
          },
          stripePayment: {
            stripePayId: null,
            stripePayStatus: null,
            amount: null,
            currency: null,
          },
          defaultPaymentMethod: null,
          stripeEventsId: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Dynamically assign the customer object to the user
        user[stripeCusField] = stripeCustomer;

        return await user.save();
      }

      throw new BadRequestException(
        `Stripe customer already exists for ${app} app`,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all customers from Medscroll or Slide DB
  async getStripeCustomers(app: AppType, page = 1, limit = 10) {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomers = await this.userModel
        .find({ [stripeCusField]: { $ne: null } }) // Dynamically query the field
        .select(stripeCusField) // Select only the relevant field
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      return { data: stripeCustomers };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get a customer from Medscroll or Slide DB
  async getStripeCustomer(stripeCustomerUUID: string, app: AppType) {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app, true);

      const stripeCustomer = await this.userModel
        .findOne({ [stripeCusField]: stripeCustomerUUID })
        .select(
          app === 'medscroll_slide'
            ? 'stripeSlideCust'
            : app === 'medscroll_clinical_exams'
            ? 'stripeClinExCust'
            : 'stripeCustomer',
        )
        .exec();

      if (!stripeCustomer)
        throw new BadRequestException('Stripe customer not found');

      return { data: stripeCustomer };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // List all stripe customers
  async listAllCustomers() {
    try {
      const stripeCustomers = await this.stripe.customers.list({
        limit: 3,
      });

      // Check if there is stripeCustomer
      if (!stripeCustomers?.data.length)
        throw new BadRequestException('Stripe customers not found');

      return stripeCustomers;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // retrieve stripe customer
  async retrieveCustomer(stripeCustomerId: string) {
    try {
      const stripeCustomer = await this.stripe.customers.retrieve(
        stripeCustomerId,
      );

      // Check if there is stripeCustomer
      if (stripeCustomer.deleted)
        throw new BadRequestException('Stripe customer not found');

      return stripeCustomer;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete stripe customer
  async deleteCustomer(stripeCustomerId: string, app: AppType) {
    try {
      // Delete the customer in Stripe
      const stripeCustomer = await this.stripe.customers.del(stripeCustomerId);

      // Check if the customer was successfully deleted
      if (!stripeCustomer.deleted) {
        throw new BadRequestException('Error deleting stripe customer');
      }

      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const userCustomer = await this.userModel.findOne({
        [`${stripeCusField}.stripeCustomerId`]: stripeCustomerId,
      });

      switch (app) {
        case AppType.MEDSCROLL_SLIDE:
          userCustomer.stripeSlideCust = null;
          userCustomer.slideSub = slideStarterPlan;
          break;

        case AppType.MEDSCROLL_CLINICAL_EXAMS:
          userCustomer.stripeClinExCust = null;
          userCustomer.clinExSub = clinExStarterPlan;
          break;

        default:
          userCustomer.stripeCustomer = null;
          userCustomer.subscription = starterPlan;
          break;
      }

      await userCustomer.save();

      return { message: 'Customer successfully deleted.' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(
    userCustomer: UserDocument,
    paymentMethodId: string,
    app?: AppType,
  ) {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = userCustomer?.[stripeCusField];

      // Check if the customer exists
      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException('Customer is not created!');
      }

      // Update the default payment method in Stripe
      const setPaymentMethod = await this.stripe.customers.update(
        stripeCustomer.stripeCustomerId,
        {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        },
      );

      if (!setPaymentMethod) {
        throw new BadRequestException('Something went wrong!');
      }

      // Update the default payment method in the database
      stripeCustomer.defaultPaymentMethod = paymentMethodId;
      stripeCustomer.updatedAt = new Date();

      userCustomer.markModified(stripeCusField);
      await userCustomer.save();

      return setPaymentMethod;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get default payment method
  async getDefaultPaymentMethod(user: UserDocument, app: AppType) {
    try {
      // Determine the customer field dynamically based on the app type
      const stripeCusField = getStripeCusField(app);

      const stripeCustomer = user?.[stripeCusField];

      // Check if the customer exists
      if (!stripeCustomer?.stripeCustomerId) {
        throw new BadRequestException(
          'Customer has not subscribed to any plan.',
        );
      }

      // Check if a default payment method is set
      if (!stripeCustomer?.defaultPaymentMethod) {
        throw new BadRequestException('Default payment method not set');
      }

      // Retrieve the default payment method from Stripe
      const paymentMethod = await this.stripe.customers.retrievePaymentMethod(
        stripeCustomer.stripeCustomerId,
        stripeCustomer.defaultPaymentMethod,
      );

      if (!paymentMethod) {
        throw new BadRequestException(
          'Error retrieving default payment method!',
        );
      }

      return { data: paymentMethod };
    } catch (error) {
      if (error?.type === 'StripeInvalidRequestError') {
        throw new BadRequestException('Invalid payment method selected!');
      }
      throw new BadRequestException(error.message);
    }
  }
}
