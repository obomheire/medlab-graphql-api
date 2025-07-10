import { Module, forwardRef } from '@nestjs/common';
import { StripeCustomerResolver } from './resolver/stripe.customer.resolver';
import { StripePaymentService } from './service/stripe.payment.service';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { StripePaymentResolver } from './resolver/stripe.payment.resolver';
import { StripeProductService } from './service/stripe.product.service';
import { StripeProductResolver } from './resolver/stripe.product.resolver';
import { StripeSubService } from './service/subscription/stripe.sub.service';
import { StripeSubResolver } from './resolver/stripe.sub.resolver';
import { StripeWebhookResolver } from './resolver/stripe.webhook.resolver';
import { StripeWebhookService } from './service/stripe.webhook.service';
import { HttpModule } from '@nestjs/axios';
import { UserEntity, UserSchema } from 'src/user/entity/user.entity';
import { ProductModule } from 'src/products/products.module';
import { StripeController } from './controller/stripe.controller';
import { StripeCustomerService } from './service/stripe.customer.service';
import { StripeClinExSubService } from './service/subscription/stripe.clinEx.sub.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: UserEntity.name,
        useFactory: () => {
          return UserSchema;
        },
      },
    ]),
    forwardRef(() => UserModule),
    HttpModule,
    ProductModule,
  ],
  controllers: [StripeController],
  providers: [
    StripeWebhookResolver,
    StripeCustomerResolver,
    StripePaymentResolver,
    StripeProductResolver,
    StripeSubResolver,
    StripePaymentService,
    StripeCustomerService,
    StripeProductService,
    StripeSubService,
    StripeWebhookService,
    StripeClinExSubService,
  ],
  exports: [StripeSubService, StripeClinExSubService],
})
export class StripeModule {}
