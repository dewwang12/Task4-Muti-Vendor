import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserContext, UserRole, DeliveryState } from '@markethub/shared';

@ApiTags('Delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERY_PARTNER)
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get unassigned deliveries ready for pickup' })
  async getAvailable() {
    return this.deliveryService.getAvailableDeliveries();
  }

  @Get('my-jobs')
  @ApiOperation({ summary: 'Get assigned deliveries for current delivery partner' })
  async getMyJobs(@CurrentUser() user: UserContext) {
    if (!user.deliveryPartnerId) {
      throw new UnauthorizedException('Delivery profile required');
    }
    return this.deliveryService.getMyDeliveries(user.deliveryPartnerId);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Claim an unassigned delivery' })
  async claim(@Param('id') id: string, @CurrentUser() user: UserContext) {
    if (!user.deliveryPartnerId) {
      throw new UnauthorizedException('Delivery profile required');
    }
    return this.deliveryService.claimDelivery(id, user.deliveryPartnerId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Advance delivery status (e.g. PICKED_UP, IN_TRANSIT, DELIVERED)' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
    @Body('status') status: DeliveryState,
    @Body('note') note?: string,
  ) {
    if (!user.deliveryPartnerId) {
      throw new UnauthorizedException('Delivery profile required');
    }
    return this.deliveryService.updateDeliveryStatus(id, user.deliveryPartnerId, status, note);
  }
}
