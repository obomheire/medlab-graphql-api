import { Public } from 'src/auth/decorator/public.decorator';
import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { StripeWebhookService } from '../service/stripe.webhook.service';
import { ReqWithRawBody } from 'src/utilities/interface/interface';

@Controller('stripe/webhook')
export class StripeController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  // Stripe webhook endpoint
  @Public()
  @Post('construct-event')
  @HttpCode(200)
  async constructEventFromPayload(
    @Headers('stripe-signature') signature: string,
    @Req() request: ReqWithRawBody,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing stripe-signature header');
    }

    return await this.stripeWebhookService.constructEventFromPayload(
      signature,
      request.rawBody,
    );
  }
}
