import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  StripeCurrencyType,
  IntervalType,
  AppType,
} from '../enum/sub.plan.enum';
import {
  ClinExStripeProdDto,
  StripeProductDto,
} from '../dto/stripe.product.input';
import { planName } from '../constants/product.constant';
import { ProductService } from 'src/products/service/products.service';
import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import { SlideProductService } from 'src/products/service/products.slide.service';
import { ClinExamProdService } from 'src/products/service/products.clinEx.service';
import { ClinExPlanType } from 'src/products/enum/product.enum';

@Injectable()
export class StripeProductService {
  private stripe: Stripe;

  constructor(
    private readonly productService: ProductService,
    private readonly slideProductService: SlideProductService,
    private readonly clinExamProdService: ClinExamProdService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2024-06-20',
      },
    );
  }

  // Create Prodcuct (Plan)
  async createStripeProduct(stripeProductDto: StripeProductDto) {
    try {
      const { productName, amountMonthly, amountYearly, isSlideProduct } =
        stripeProductDto;

      let monthlyPriceId: string | null = null;
      let yearlyPriceId: string | null = null;

      const prices = [];

      // Add the monthly price configuration if provided
      if (amountMonthly) {
        prices.push({
          currency: StripeCurrencyType.AUD,
          unit_amount: amountMonthly, // Amount in cents X USD * 100
          recurring: {
            interval: IntervalType.MONTH,
            interval_count: 1,
          }, // Monthly subscription
        });
      }

      // Add the yearly price configuration if provided
      if (amountYearly) {
        prices.push({
          currency: StripeCurrencyType.AUD,
          unit_amount: amountYearly, // Amount in cents Y USD * 100
          recurring: {
            interval: IntervalType.YEAR,
            interval_count: 1,
          }, // Yearly subscription
        });
      }

      const stripeProduct = await this.stripe.products.create({
        name: productName,
        type: 'service', // Set to 'service' if the product is a subscription service
        active: true,
        metadata: {
          app: isSlideProduct ? AppType.MEDSCROLL_SLIDE : AppType.MEDSCROLL,
        },
      });

      for (const price of prices) {
        const stripePrice = await this.stripe.prices.create({
          product: stripeProduct.id,
          ...price,
        });

        if (price.recurring.interval === IntervalType.MONTH) {
          monthlyPriceId = stripePrice.id;
        } else if (price.recurring.interval === IntervalType.YEAR) {
          yearlyPriceId = stripePrice.id;
        }
      }

      if (!stripeProduct)
        throw new BadRequestException('Error creating product');

      // Choose the appropriate service and plan name lookup
      const productService = isSlideProduct
        ? this.slideProductService
        : this.productService;

      const product = await productService.getProductByPlan(
        productName === SubPlanType.STARTER
          ? planName.starter
          : productName === SubPlanType.PRO
          ? planName.pro
          : productName === SubPlanType.PREMIUM
          ? planName.premium
          : productName === SubPlanType.SLIDE_STARTER
          ? planName.slideStarter
          : productName === SubPlanType.SLIDE_PRO
          ? planName.slidePro
          : planName.slidePremium,
      );

      const updateProduct = {
        stripeProductId: stripeProduct.id,
        monthlyPriceId:
          productName === SubPlanType.STARTER ? null : monthlyPriceId,
        yearlyPriceId:
          productName === SubPlanType.STARTER ? null : yearlyPriceId,
      };

      // Update product
      product.stripeProduct = updateProduct;
      await product.save();

      return { data: stripeProduct };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create Prodcuct (Plan)
  async createClinExStripeProd(clinExStripeProdDto: ClinExStripeProdDto) {
    try {
      const { productName, amountMonthly, amount4Months } = clinExStripeProdDto;

      let monthlyPriceId: string | null = null;
      let fourMonthsPriceId: string | null = null;

      const prices = [];

      // Add the monthly price configuration if provided
      if (amountMonthly) {
        prices.push({
          currency: StripeCurrencyType.AUD,
          unit_amount: amountMonthly, // Amount in cents X USD * 100
          recurring: {
            interval: IntervalType.MONTH,
            interval_count: 1,
          }, // Monthly subscription
        });
      }

      // Add the yearly price configuration if provided
      if (amount4Months) {
        prices.push({
          currency: StripeCurrencyType.AUD,
          unit_amount: amount4Months, // Amount in cents Y USD * 100
          recurring: {
            interval: IntervalType.MONTH,
            interval_count: 4,
          }, // Charge every 4 months
        });
      }

      const stripeProduct = await this.stripe.products.create({
        name: productName,
        type: 'service', // Set to 'service' if the product is a subscription service
        active: true,
        metadata: {
          app: AppType.MEDSCROLL_CLINICAL_EXAMS,
        },
      });

      for (const price of prices) {
        const stripePrice = await this.stripe.prices.create({
          product: stripeProduct.id,
          ...price,
        });

        if (price.recurring.interval_count === 1) {
          monthlyPriceId = stripePrice.id;
        } else if (price.recurring.interval_count === 4) {
          fourMonthsPriceId = stripePrice.id;
        }
      }

      if (!stripeProduct)
        throw new BadRequestException('Error creating product');
      // Choose the appropriate service and plan name lookup
      const product = await this.clinExamProdService.getProductByPlan(
        productName,
      );

      const updateProduct = {
        stripeProductId: stripeProduct.id,
        monthlyPriceId:
          productName === ClinExPlanType.STARTER ? null : monthlyPriceId,
        fourMonthsPriceId:
          productName === ClinExPlanType.STARTER ? null : fourMonthsPriceId,
      };

      // Update product
      product.stripeProduct = updateProduct;
      await product.save();

      return { data: stripeProduct };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all products from stripe database
  async listAllStripeProducts() {
    try {
      return await this.stripe.products.list({});
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get a product from loopscripe database
  async retrieveStripeProduct(stripeProductId: string) {
    try {
      const product = await this.stripe.products.retrieve(stripeProductId);

      return { data: product };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
