import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserContext, UserRole, VendorStatus } from '@markethub/shared';

@ApiTags('Admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Platform-wide analytics (GMV, commissions, orders, vendors)' })
  async getAnalytics() {
    return this.adminService.getPlatformAnalytics();
  }

  @Get('vendors')
  @ApiOperation({ summary: 'List all vendors with status filter' })
  async getVendors(@Query('status') status?: VendorStatus) {
    return this.adminService.getVendors(status);
  }

  @Patch('vendors/:id/status')
  @ApiOperation({ summary: 'Approve, Reject, or Suspend vendor application' })
  async updateVendorStatus(
    @Param('id') id: string,
    @Body('status') status: VendorStatus,
    @Body('reason') reason: string,
    @CurrentUser() admin: UserContext,
  ) {
    return this.adminService.updateVendorStatus(id, status, admin.id, reason);
  }

  @Patch('vendors/:id/commission')
  @ApiOperation({ summary: 'Configure vendor custom commission rate in basis points' })
  async updateCommission(
    @Param('id') id: string,
    @Body('commissionRateBps') rateBps: number,
    @CurrentUser() admin: UserContext,
  ) {
    return this.adminService.updateVendorCommission(id, Number(rateBps), admin.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Monitor all platform parent orders and suborders' })
  async getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'View immutable security and administrative audit trail' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
