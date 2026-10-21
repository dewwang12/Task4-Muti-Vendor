import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { InitializeCheckoutDto } from './dto/checkout.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserContext } from '@markethub/shared';

@ApiTags('Checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Atomically reserve stock and create parent order + vendor sub-orders' })
  async initializeCheckout(
    @CurrentUser() user: UserContext,
    @Body() dto: InitializeCheckoutDto,
  ) {
    return this.checkoutService.initializeCheckout(user.id, dto);
  }

  @Post('confirm/:orderId')
  @ApiOperation({ summary: 'Confirm mock/sandbox payment and permanently consume stock' })
  async confirmPayment(
    @Param('orderId') orderId: string,
    @Body() body: { success: boolean; transactionId?: string; reason?: string },
  ) {
    return this.checkoutService.confirmPayment(orderId, {
      success: body.success !== false,
      transactionId: body.transactionId,
      reason: body.reason,
    });
  }
}
