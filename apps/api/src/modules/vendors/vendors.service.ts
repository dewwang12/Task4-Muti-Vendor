import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorOrderStatus } from '@markethub/shared';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        _count: { select: { products: true, vendorOrders: true } },
      },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found for this account');
    }
    return vendor;
  }

  async updateProfile(
    vendorId: string,
    data: {
      description?: string;
      logoUrl?: string;
      bannerUrl?: string;
      businessPhone?: string;
      bankAccountNumber?: string;
      bankIfscCode?: string;
    },
  ) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data,
    });
  }

  async getMyProducts(vendorId: string) {
    return this.prisma.product.findMany({
      where: { vendorId },
      include: {
        inventory: true,
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyOrders(vendorId: string) {
    return this.prisma.vendorOrder.findMany({
      where: { vendorId },
      include: {
        order: {
          select: {
            orderNumber: true,
            shippingAddressSnapshot: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        items: true,
        delivery: true,
        commissionRecord: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyOrderDetails(vendorId: string, vendorOrderId: string) {
    const order = await this.prisma.vendorOrder.findUnique({
      where: { id: vendorOrderId },
      include: {
        order: {
          select: {
            orderNumber: true,
            shippingAddressSnapshot: true,
            billingAddressSnapshot: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        items: true,
        delivery: { include: { history: { orderBy: { createdAt: 'asc' } } } },
        commissionRecord: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Sub-order not found');
    }
    if (order.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied to unrelated vendor order');
    }

    return order;
  }

  async updateOrderStatus(vendorId: string, vendorOrderId: string, newStatus: VendorOrderStatus) {
    const order = await this.prisma.vendorOrder.findUnique({ where: { id: vendorOrderId } });
    if (!order) throw new NotFoundException('Sub-order not found');
    if (order.vendorId !== vendorId) throw new ForbiddenException('Unauthorized');

    // State transition validation for vendor
    const allowedTransitions: Record<string, string[]> = {
      CONFIRMED: ['PREPARING'],
      PREPARING: ['READY_FOR_PICKUP'],
      READY_FOR_PICKUP: [], // Once ready, delivery partner transitions to PICKED_UP
    };

    const permitted = allowedTransitions[order.status] || [];
    if (!permitted.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition order status from '${order.status}' to '${newStatus}'. Permitted: [${permitted.join(', ')}]`,
      );
    }

    return this.prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: { status: newStatus as any },
      include: { items: true, delivery: true },
    });
  }

  async getAnalytics(vendorId: string) {
    const [products, vendorOrders] = await Promise.all([
      this.prisma.product.findMany({
        where: { vendorId },
        include: { inventory: true },
      }),
      this.prisma.vendorOrder.findMany({
        where: { vendorId },
        include: { commissionRecord: true, items: true },
      }),
    ]);

    const totalOrders = vendorOrders.length;
    let totalSalesMinor = 0;
    let totalCommissionMinor = 0;
    let totalPayoutMinor = 0;
    let totalUnitsSold = 0;

    for (const vo of vendorOrders) {
      totalSalesMinor += vo.subtotalMinor;
      totalCommissionMinor += vo.platformCommissionMinor;
      totalPayoutMinor += vo.vendorPayoutMinor;
      for (const item of vo.items) {
        totalUnitsSold += item.quantity;
      }
    }

    const lowStockProducts = products.filter(
      (p) =>
        (p.inventory?.quantity || 0) - (p.inventory?.reservedQuantity || 0) <=
        (p.inventory?.lowStockThreshold || 5),
    );

    return {
      totalOrders,
      totalProducts: products.length,
      totalUnitsSold,
      totalSalesMinor,
      totalCommissionMinor,
      totalPayoutMinor,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        title: p.title,
        sku: p.sku,
        availableStock: Math.max(0, (p.inventory?.quantity || 0) - (p.inventory?.reservedQuantity || 0)),
        threshold: p.inventory?.lowStockThreshold,
      })),
      recentOrders: vendorOrders.slice(0, 5),
    };
  }
}
