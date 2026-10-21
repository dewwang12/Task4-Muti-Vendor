import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId?: string, sessionToken?: string) {
    if (!userId && !sessionToken) {
      return { items: [], vendorGroups: [], totalAmountMinor: 0, totalItems: 0 };
    }

    let cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionToken },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: { select: { id: true, storeName: true, slug: true } },
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
                inventory: { select: { quantity: true, reservedQuantity: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      return { id: null, items: [], vendorGroups: [], totalAmountMinor: 0, totalItems: 0 };
    }

    // Group items by vendor
    const vendorMap = new Map<string, any>();
    let totalAmountMinor = 0;
    let totalItems = 0;

    for (const item of cart.items) {
      const product = item.product;
      const availableStock = Math.max(
        0,
        (product.inventory?.quantity || 0) - (product.inventory?.reservedQuantity || 0),
      );
      const lineTotalMinor = product.priceMinor * item.quantity;
      totalAmountMinor += lineTotalMinor;
      totalItems += item.quantity;

      if (!vendorMap.has(product.vendor.id)) {
        vendorMap.set(product.vendor.id, {
          vendorId: product.vendor.id,
          vendorStoreName: product.vendor.storeName,
          vendorSlug: product.vendor.slug,
          subtotalMinor: 0,
          items: [],
        });
      }

      const group = vendorMap.get(product.vendor.id);
      group.subtotalMinor += lineTotalMinor;
      group.items.push({
        cartItemId: item.id,
        productId: product.id,
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        unitPriceMinor: product.priceMinor,
        quantity: item.quantity,
        totalPriceMinor: lineTotalMinor,
        imageUrl: product.images[0]?.url,
        availableStock,
      });
    }

    return {
      id: cart.id,
      vendorGroups: Array.from(vendorMap.values()),
      totalAmountMinor,
      totalItems,
    };
  }

  async addItem(
    productId: string,
    quantity: number,
    userId?: string,
    sessionToken?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product is not available for purchase');
    }

    const availableStock = Math.max(
      0,
      (product.inventory?.quantity || 0) - (product.inventory?.reservedQuantity || 0),
    );

    if (quantity > availableStock) {
      throw new BadRequestException(
        `Insufficient inventory. Only ${availableStock} units currently available.`,
      );
    }

    let cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionToken },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId: userId || null,
          sessionToken: !userId ? sessionToken : null,
        },
      });
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableStock) {
        throw new BadRequestException(
          `Cannot add ${quantity} more. Total in cart would exceed available stock (${availableStock}).`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart(userId, sessionToken);
  }

  async updateQuantity(
    cartItemId: string,
    quantity: number,
    userId?: string,
    sessionToken?: string,
  ) {
    if (quantity <= 0) {
      return this.removeItem(cartItemId, userId, sessionToken);
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: { include: { inventory: true } } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const availableStock = Math.max(
      0,
      (item.product.inventory?.quantity || 0) - (item.product.inventory?.reservedQuantity || 0),
    );

    if (quantity > availableStock) {
      throw new BadRequestException(
        `Requested quantity exceeds available stock (${availableStock}).`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getCart(userId, sessionToken);
  }

  async removeItem(cartItemId: string, userId?: string, sessionToken?: string) {
    await this.prisma.cartItem.deleteMany({
      where: { id: cartItemId },
    });
    return this.getCart(userId, sessionToken);
  }

  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
