import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  RawBody,
  SetMetadata,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; roles: string[] };
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @SetMetadata('isPublic', true)
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Post('checkout')
  async createCheckout(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.subscriptionsService.createCheckoutSession(
      req.user.userId,
      dto.planName,
    );
  }

  @Get('me')
  async getMySubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.getMySubscription(req.user.userId);
  }

  @Get('history')
  async getHistory(@Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.getSubscriptionHistory(req.user.userId);
  }

  @Post('cancel')
  async cancelSubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.cancelSubscription(req.user.userId);
  }

  @Post('webhook')
  @SetMetadata('isPublic', true)
  async handleWebhook(
    @RawBody() payload: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.subscriptionsService.handleWebhook(payload, signature);
    return { received: true };
  }
}
