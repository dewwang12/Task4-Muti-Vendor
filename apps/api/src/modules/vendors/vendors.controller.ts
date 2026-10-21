import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserContext, UserRole, VendorOrderStatus } from '@markethub/shared';

@ApiTags('Vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@ApiBearerAuth()
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current vendor store profile' })
  async getProfile(@CurrentUser() user: UserContext) {
    return this.vendorsService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update vendor store profile details' })
  async updateProfile(@CurrentUser() user: UserContext, @Body() body: any) {
    if (!user.vendorId) throw new UnauthorizedException('Vendor profile required');
    return this.vendorsService.updateProfile(user.vendorId, body);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get current vendor products with inventory status' })
  async getMyProducts(@CurrentUser() user: UserContext) {
    if (!user.vendorId) throw new UnauthorizedException('Vendor profile required');
    return this.vendorsService.getMyProducts(user.vendorId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get vendor sub-orders with customer shipping details' })
  async getMyOrders(@CurrentUser() user: UserContext) {
    if (!user.vendorId) throw new UnauthorizedException('Vendor profile required');
    return this.vendorsService.getMyOrders(user.vendorId);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get vendor sub-order details' })
  async getMyOrderDetails(@Param('id') id: string, @CurrentUser() user: UserContext) {
    if (!user.vendorId) throw new UnauthorizedException('Vendor profile required');
    return this.vendorsService.getMyOrderDetails(user.vendorId, id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update sub-order status (e.g. PREPARING, READY_FOR_PICKUP)' })
  async updateOrderStatus(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
    @Body('status') status: VendorOrderStatus,
  ) {
    if (!user.vendorId) throw new UnauthorizedException('Vendor profile required');
    return this.vendorsService.updateOrderStatus(user.vendorId, id, status);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get vendor sales, units, commissions, and low-stock alerts' })
  async getAnalytics(@CurrentUser() user: UserContext) {
    if (!user.vendorId) throw new UnauthorizedException('Vendor profile required');
    return this.vendorsService.getAnalytics(user.vendorId);
  }
}
