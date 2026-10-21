import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    customerId: string,
    productId: string,
    rating: number,
    comment: string,
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5 stars');
    }

    // 1. Verify that customer has actually purchased this product in a paid order
    const verifiedItem = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        vendorOrder: {
          order: {
            customerId,
            paymentStatus: 'PAID',
          },
        },
      },
    });

    if (!verifiedItem) {
      throw new BadRequestException(
        'Review eligibility policy: You may only review products from your verified, paid orders.',
      );
    }

    // 2. Prevent duplicate reviews by same customer on same product
    const existing = await this.prisma.review.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a review for this product');
    }

    return this.prisma.review.create({
      data: {
        productId,
        customerId,
        orderItemId: verifiedItem.id,
        rating,
        comment,
        isVerifiedPurchase: true,
        isApproved: true,
      },
    });
  }

  async getProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, isApproved: true },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
