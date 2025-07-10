import { Public } from 'src/auth/decorator/public.decorator';
import { RevenuecatService } from '../service/revenuecat.service';
import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';

@Controller('revenuecat')
export class RevenuecatController {
  constructor(private revenuecatService: RevenuecatService) {}

  // Revenuecat webhook endpoint
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async revenuecatWebhook(
    @Headers('authorization') authorization: string,
    @Body() eventPayload: any,
  ) {
    return await this.revenuecatService.revenuecatWebhook(
      authorization,
      eventPayload,
    );
  }
}
