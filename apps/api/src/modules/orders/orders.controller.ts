import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserContext } from '@markethub/shared';

@ApiTags('Orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List customer parent orders' })
  async getMyOrders(@CurrentUser() user: UserContext) {
    return this.ordersService.getMyOrders(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer parent order details with sub-orders and tracking' })
  async getOrderDetails(@Param('id') id: string, @CurrentUser() user: UserContext) {
    return this.ordersService.getOrderDetails(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Request order cancellation' })
  async cancelOrder(@Param('id') id: string, @CurrentUser() user: UserContext) {
    return this.ordersService.cancelOrder(id, user.id);
  }
}
