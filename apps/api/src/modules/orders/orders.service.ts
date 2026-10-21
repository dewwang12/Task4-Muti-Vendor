import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { customerId: userId },
      include: {
        vendorOrders: {
          include: {
            vendor: { select: { storeName: true, slug: true } },
            items: true,
            delivery: { select: { trackingCode: true, status: true } },
          },
        },
        payments: { select: { provider: true, status: true, amountMinor: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderDetails(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorOrders: {
          include: {
            vendor: { select: { id: true, storeName: true, slug: true, logoUrl: true } },
            items: true,
            delivery: {
              include: {
                deliveryPartner: { select: { vehicleType: true } },
                history: { orderBy: { createdAt: 'asc' } },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendorOrders: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== userId) throw new ForbiddenException('Unauthorized');

    if (order.overallStatus === 'DELIVERED' || order.overallStatus === 'SHIPPED') {
      throw new BadRequestException('Cannot cancel an order that has already shipped or delivered');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        overallStatus: 'CANCELLED',
        vendorOrders: {
          updateMany: {
            where: { status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED'] } },
            data: { status: 'CANCELLED' },
          },
        },
      },
    });
  }
}
