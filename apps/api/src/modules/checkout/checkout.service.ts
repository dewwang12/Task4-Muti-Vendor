import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitializeCheckoutDto } from './dto/checkout.dto';
import {
  PaymentStatus,
  OrderOverallStatus,
  VendorOrderStatus,
  DeliveryState,
} from '@markethub/shared';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes atomic checkout:
   * 1. Validates customer cart and active items.
   * 2. Reserves stock with concurrency checks.
   * 3. Calculates authoritative server-side totals.
   * 4. Creates Parent Order and splits into distinct Vendor Sub-Orders.
   * 5. Creates immutable purchase-time snapshots for items.
   * 6. Generates payment record.
   * 7. Clears cart items upon successful order generation.
   */
  async initializeCheckout(userId: string, dto: InitializeCheckoutDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true,
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cannot checkout an empty shopping cart');
    }

    // Check idempotency if key supplied
    if (dto.idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: {
          vendorOrders: { include: { items: true, delivery: true } },
          payments: true,
        },
      });
      if (existing) {
        return existing;
      }
    }

    // Execute atomic checkout in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Group items by vendor while checking stock
      const vendorGroupMap = new Map<string, { vendor: any; items: any[] }>();
      let overallSubtotalMinor = 0;

      for (const cartItem of cart.items) {
        const product = cartItem.product;
        if (product.status !== 'ACTIVE') {
          throw new BadRequestException(`Product '${product.title}' is no longer active`);
        }

        // Lock inventory row & verify stock
        const inventory = await tx.inventory.findUnique({
          where: { productId: product.id },
        });

        if (!inventory) {
          throw new NotFoundException(`Inventory record for '${product.title}' not found`);
        }

        const available = inventory.quantity - inventory.reservedQuantity;
        if (cartItem.quantity > available) {
          throw new ConflictException(
            `Insufficient stock for '${product.title}'. Only ${available} available (requested: ${cartItem.quantity}).`,
          );
        }

        // Atomically increment reserved stock
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            reservedQuantity: { increment: cartItem.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            changeType: 'RESERVATION',
            quantityDelta: cartItem.quantity,
            balanceAfter: inventory.quantity,
            referenceType: 'CHECKOUT',
            reason: `Reserved for checkout by user ${userId}`,
          },
        });

        const lineTotalMinor = product.priceMinor * cartItem.quantity;
        overallSubtotalMinor += lineTotalMinor;

        if (!vendorGroupMap.has(product.vendorId)) {
          vendorGroupMap.set(product.vendorId, {
            vendor: product.vendor,
            items: [],
          });
        }

        vendorGroupMap.get(product.vendorId)!.items.push({
          cartItem,
          product,
          lineTotalMinor,
        });
      }

      // 2. Generate unique order numbers
      const timestampSuffix = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const parentOrderNumber = `MH-${timestampSuffix}-${randomSuffix}`;

      // 3. Create Parent Order
      const parentOrder = await tx.order.create({
        data: {
          orderNumber: parentOrderNumber,
          customerId: userId,
          shippingAddressSnapshot: dto.shippingAddress as any,
          billingAddressSnapshot: (dto.billingAddress || dto.shippingAddress) as any,
          totalAmountMinor: overallSubtotalMinor,
          itemsSubtotalMinor: overallSubtotalMinor,
          shippingFeeMinor: 0,
          discountMinor: 0,
          paymentStatus: PaymentStatus.PENDING as any,
          overallStatus: OrderOverallStatus.PLACED as any,
          paymentMethod: dto.paymentMethod || 'MOCK_CARD',
          idempotencyKey: dto.idempotencyKey,
        },
      });

      // 4. Create Vendor Sub-Orders
      let subIndex = 1;
      const createdVendorOrders = [];

      for (const [vendorId, group] of vendorGroupMap.entries()) {
        const subOrderNumber = `${parentOrderNumber}-V${subIndex++}`;
        let vendorSubtotalMinor = 0;

        for (const item of group.items) {
          vendorSubtotalMinor += item.lineTotalMinor;
        }

        // Commission calculation in Basis Points (bps)
        const commBps = group.vendor.commissionRateBps || 1000;
        const platformCommMinor = Math.round((vendorSubtotalMinor * commBps) / 10000);
        const vendorPayoutMinor = vendorSubtotalMinor - platformCommMinor;

        const vendorOrder = await tx.vendorOrder.create({
          data: {
            subOrderNumber,
            orderId: parentOrder.id,
            vendorId,
            subtotalMinor: vendorSubtotalMinor,
            commissionRateBps: commBps,
            platformCommissionMinor: platformCommMinor,
            vendorPayoutMinor,
            status: VendorOrderStatus.PENDING_CONFIRMATION as any,
            items: {
              create: group.items.map((i) => ({
                productId: i.product.id,
                titleSnapshot: i.product.title,
                skuSnapshot: i.product.sku,
                unitPriceMinor: i.product.priceMinor,
                quantity: i.cartItem.quantity,
                totalPriceMinor: i.lineTotalMinor,
              })),
            },
            commissionRecord: {
              create: {
                grossAmountMinor: vendorSubtotalMinor,
                commissionRateBps: commBps,
                commissionAmountMinor: platformCommMinor,
                netVendorAmountMinor: vendorPayoutMinor,
                isSettled: false,
              },
            },
            delivery: {
              create: {
                trackingCode: `TRK-${subOrderNumber}`,
                status: DeliveryState.PENDING_ASSIGNMENT as any,
                recipientName: dto.shippingAddress.recipientName,
                recipientPhone: dto.shippingAddress.phone,
                deliveryAddress: `${dto.shippingAddress.streetLine1}, ${dto.shippingAddress.city}, ${dto.shippingAddress.state} ${dto.shippingAddress.postalCode}`,
                history: {
                  create: [
                    {
                      status: DeliveryState.PENDING_ASSIGNMENT as any,
                      note: 'Order placed, awaiting vendor confirmation and rider assignment',
                    },
                  ],
                },
              },
            },
          },
          include: {
            items: true,
            delivery: true,
            commissionRecord: true,
          },
        });

        createdVendorOrders.push(vendorOrder);
      }

      // 5. Initialize Payment Attempt Record
      const payment = await tx.payment.create({
        data: {
          orderId: parentOrder.id,
          provider: 'MOCK',
          amountMinor: overallSubtotalMinor,
          currency: 'INR',
          status: PaymentStatus.PENDING as any,
        },
      });

      // 6. Clear user cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return {
        order: parentOrder,
        subOrders: createdVendorOrders,
        payment,
      };
    });
  }

  /**
   * Confirms payment for an order (Mock payment or provider verification):
   * Concludes reservation, consumes stock permanently, updates order & sub-order statuses.
   */
  async confirmPayment(orderId: string, paymentResult: { success: boolean; transactionId?: string; reason?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          vendorOrders: {
            include: { items: true },
          },
          payments: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.paymentStatus === 'PAID') {
        return order; // Already paid
      }

      const payment = order.payments[0];

      if (paymentResult.success) {
        // 1. Mark payment succeeded
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID as any,
            providerPaymentId: paymentResult.transactionId || `mock_txn_${Date.now()}`,
          },
        });

        // 2. Mark Parent Order as PAID and PROCESSING
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.PAID as any,
            overallStatus: OrderOverallStatus.PROCESSING as any,
          },
        });

        // 3. Mark Sub-Orders as CONFIRMED and permanently deduct reserved stock
        for (const vo of order.vendorOrders) {
          await tx.vendorOrder.update({
            where: { id: vo.id },
            data: { status: VendorOrderStatus.CONFIRMED as any },
          });

          for (const item of vo.items) {
            if (item.productId) {
              const inventory = await tx.inventory.findUnique({
                where: { productId: item.productId },
              });

              if (inventory) {
                await tx.inventory.update({
                  where: { id: inventory.id },
                  data: {
                    quantity: { decrement: item.quantity },
                    reservedQuantity: { decrement: item.quantity },
                  },
                });

                await tx.inventoryMovement.create({
                  data: {
                    inventoryId: inventory.id,
                    changeType: 'SALE',
                    quantityDelta: -item.quantity,
                    balanceAfter: inventory.quantity - item.quantity,
                    referenceType: 'ORDER',
                    referenceId: vo.id,
                    reason: `Sale confirmed for sub-order ${vo.subOrderNumber}`,
                  },
                });
              }
            }
          }
        }

        return {
          success: true,
          status: 'PAID',
          orderId: order.id,
          orderNumber: order.orderNumber,
        };
      } else {
        // Payment failed: Release reserved inventory
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED as any,
            failureReason: paymentResult.reason || 'Payment declined by test provider',
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.FAILED as any,
            overallStatus: OrderOverallStatus.CANCELLED as any,
          },
        });

        for (const vo of order.vendorOrders) {
          await tx.vendorOrder.update({
            where: { id: vo.id },
            data: { status: VendorOrderStatus.CANCELLED as any },
          });

          for (const item of vo.items) {
            if (item.productId) {
              const inventory = await tx.inventory.findUnique({
                where: { productId: item.productId },
              });

              if (inventory) {
                await tx.inventory.update({
                  where: { id: inventory.id },
                  data: {
                    reservedQuantity: { decrement: item.quantity },
                  },
                });

                await tx.inventoryMovement.create({
                  data: {
                    inventoryId: inventory.id,
                    changeType: 'RELEASE',
                    quantityDelta: item.quantity,
                    balanceAfter: inventory.quantity,
                    referenceType: 'CHECKOUT_FAIL',
                    reason: `Reservation released due to payment failure`,
                  },
                });
              }
            }
          }
        }

        return {
          success: false,
          status: 'FAILED',
          message: paymentResult.reason || 'Payment failed and stock reservations released',
        };
      }
    });
  }
}
