import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorStatus } from '@markethub/shared';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformAnalytics() {
    const [
      totalCustomers,
      totalVendors,
      pendingVendors,
      totalOrders,
      orders,
      commissionRecords,
      totalProducts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.vendor.count({ where: { status: 'APPROVED' } }),
      this.prisma.vendor.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.order.count(),
      this.prisma.order.findMany({ select: { totalAmountMinor: true, paymentStatus: true } }),
      this.prisma.commissionRecord.findMany({ select: { commissionAmountMinor: true } }),
      this.prisma.product.count(),
    ]);

    let totalGmvMinor = 0;
    for (const ord of orders) {
      if (ord.paymentStatus === 'PAID') {
        totalGmvMinor += ord.totalAmountMinor;
      }
    }

    let totalPlatformCommissionMinor = 0;
    for (const comm of commissionRecords) {
      totalPlatformCommissionMinor += comm.commissionAmountMinor;
    }

    return {
      totalCustomers,
      totalVendors,
      pendingVendors,
      totalOrders,
      totalProducts,
      totalGmvMinor,
      totalPlatformCommissionMinor,
    };
  }

  async getVendors(status?: VendorStatus) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.vendor.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        _count: { select: { products: true, vendorOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVendorStatus(
    vendorId: string,
    status: VendorStatus,
    adminId: string,
    reason?: string,
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          status: status as any,
          rejectionReason: status === VendorStatus.REJECTED ? reason : null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'ADMIN',
          action: 'VENDOR_STATUS_UPDATE',
          entityName: 'Vendor',
          entityId: vendorId,
          metadata: {
            oldStatus: vendor.status,
            newStatus: status,
            reason,
          },
        },
      });

      return updated;
    });
  }

  async updateVendorCommission(vendorId: string, commissionRateBps: number, adminId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.vendor.update({
        where: { id: vendorId },
        data: { commissionRateBps },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'ADMIN',
          action: 'COMMISSION_RATE_UPDATE',
          entityName: 'Vendor',
          entityId: vendorId,
          metadata: {
            oldRateBps: vendor.commissionRateBps,
            newRateBps: commissionRateBps,
          },
        },
      });

      return updated;
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        customer: { select: { name: true, email: true } },
        vendorOrders: {
          include: {
            vendor: { select: { storeName: true } },
            delivery: { select: { trackingCode: true, status: true } },
            commissionRecord: true,
            _count: { select: { items: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
