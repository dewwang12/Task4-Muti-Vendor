import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryState, OrderOverallStatus, VendorOrderStatus } from '@markethub/shared';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableDeliveries() {
    return this.prisma.delivery.findMany({
      where: {
        status: DeliveryState.PENDING_ASSIGNMENT,
      },
      include: {
        vendorOrder: {
          include: {
            vendor: { select: { storeName: true, businessPhone: true } },
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyDeliveries(riderId: string) {
    return this.prisma.delivery.findMany({
      where: { deliveryPartnerId: riderId },
      include: {
        vendorOrder: {
          include: {
            vendor: { select: { storeName: true, businessPhone: true } },
            items: true,
          },
        },
        history: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async claimDelivery(deliveryId: string, riderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== DeliveryState.PENDING_ASSIGNMENT) {
      throw new BadRequestException('This delivery has already been assigned');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          deliveryPartnerId: riderId,
          status: DeliveryState.ASSIGNED,
        },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          status: DeliveryState.ASSIGNED,
          note: 'Claimed by delivery partner',
        },
      });

      return updated;
    });
  }

  async updateDeliveryStatus(
    deliveryId: string,
    riderId: string,
    newStatus: DeliveryState,
    note?: string,
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { vendorOrder: { include: { order: true } } },
    });

    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.deliveryPartnerId !== riderId) {
      throw new ForbiddenException('You are not assigned to this delivery');
    }

    // Permitted state transitions
    const validTransitions: Record<string, string[]> = {
      ASSIGNED: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP: ['IN_TRANSIT'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED_ATTEMPT'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_ATTEMPT'],
      FAILED_ATTEMPT: ['OUT_FOR_DELIVERY', 'CANCELLED'],
    };

    const allowed = validTransitions[delivery.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${delivery.status}' to '${newStatus}'. Permitted: [${allowed.join(', ')}]`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = { status: newStatus };
      if (newStatus === DeliveryState.PICKED_UP) {
        updateData.pickupTimestamp = new Date();
      }
      if (newStatus === DeliveryState.DELIVERED) {
        updateData.deliveredTimestamp = new Date();
      }

      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: updateData,
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          status: newStatus,
          note: note || `Status transitioned to ${newStatus}`,
        },
      });

      // Synchronize VendorOrder status
      if (newStatus === DeliveryState.PICKED_UP) {
        await tx.vendorOrder.update({
          where: { id: delivery.vendorOrderId },
          data: { status: VendorOrderStatus.PICKED_UP as any },
        });
      } else if (newStatus === DeliveryState.IN_TRANSIT || newStatus === DeliveryState.OUT_FOR_DELIVERY) {
        await tx.vendorOrder.update({
          where: { id: delivery.vendorOrderId },
          data: { status: VendorOrderStatus.IN_TRANSIT as any },
        });
      } else if (newStatus === DeliveryState.DELIVERED) {
        await tx.vendorOrder.update({
          where: { id: delivery.vendorOrderId },
          data: { status: VendorOrderStatus.DELIVERED as any },
        });

        // Check if all suborders for parent order are delivered
        const parentOrderId = delivery.vendorOrder.orderId;
        const remainingUndelivered = await tx.vendorOrder.count({
          where: {
            orderId: parentOrderId,
            status: { not: VendorOrderStatus.DELIVERED as any },
          },
        });

        if (remainingUndelivered === 0) {
          await tx.order.update({
            where: { id: parentOrderId },
            data: { overallStatus: OrderOverallStatus.DELIVERED as any },
          });
        }
      }

      return updatedDelivery;
    });
  }
}
