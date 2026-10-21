import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductStatus } from '@markethub/shared';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const {
      q,
      category,
      vendor,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = query;

    const where: any = {
      status: ProductStatus.ACTIVE,
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        OR: [{ slug: category }, { id: category }],
      };
    }

    if (vendor) {
      where.vendor = {
        OR: [{ slug: vendor }, { id: vendor }],
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceMinor = {};
      if (minPrice !== undefined) where.priceMinor.gte = minPrice;
      if (maxPrice !== undefined) where.priceMinor.lte = maxPrice;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { priceMinor: 'asc' };
    if (sort === 'price_desc') orderBy = { priceMinor: 'desc' };

    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          vendor: { select: { id: true, storeName: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          inventory: { select: { quantity: true, reservedQuantity: true, lowStockThreshold: true } },
          _count: { select: { reviews: true } },
        },
      }),
    ]);

    const formatted = products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      priceMinor: p.priceMinor,
      compareAtPriceMinor: p.compareAtPriceMinor,
      sku: p.sku,
      status: p.status,
      isFeatured: p.isFeatured,
      vendor: p.vendor,
      category: p.category,
      images: p.images,
      availableStock: Math.max(0, (p.inventory?.quantity || 0) - (p.inventory?.reservedQuantity || 0)),
      reviewsCount: p._count.reviews,
    }));

    return {
      items: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        vendor: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            description: true,
            logoUrl: true,
            status: true,
          },
        },
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: { select: { quantity: true, reservedQuantity: true, lowStockThreshold: true } },
        reviews: {
          where: { isApproved: true },
          include: { customer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' was not found`);
    }

    const availableStock = Math.max(
      0,
      (product.inventory?.quantity || 0) - (product.inventory?.reservedQuantity || 0),
    );

    return {
      ...product,
      availableStock,
    };
  }

  async createByVendor(vendorId: string, dto: CreateProductDto) {
    const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existingSku) {
      throw new ConflictException(`A product with SKU '${dto.sku}' already exists`);
    }

    const slug = dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          vendorId,
          categoryId: dto.categoryId,
          title: dto.title,
          slug,
          description: dto.description,
          priceMinor: dto.priceMinor,
          compareAtPriceMinor: dto.compareAtPriceMinor,
          sku: dto.sku,
          status: ProductStatus.ACTIVE as any,
          inventory: {
            create: {
              quantity: dto.initialStock || 0,
              reservedQuantity: 0,
              lowStockThreshold: 5,
            },
          },
          images: {
            create: (dto.imageUrls || []).map((url, idx) => ({
              url,
              key: `products/${slug}-${idx}.jpg`,
              sortOrder: idx,
            })),
          },
        },
        include: {
          inventory: true,
          images: true,
        },
      });

      if (dto.initialStock && dto.initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            inventoryId: product.inventory!.id,
            changeType: 'RESTOCK',
            quantityDelta: dto.initialStock,
            balanceAfter: dto.initialStock,
            reason: 'Initial product stock creation',
          },
        });
      }

      return product;
    });
  }

  async updateByVendor(productId: string, vendorId: string, updates: Partial<CreateProductDto>) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You do not have permission to modify this product');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        title: updates.title,
        description: updates.description,
        priceMinor: updates.priceMinor,
        compareAtPriceMinor: updates.compareAtPriceMinor,
        categoryId: updates.categoryId,
      },
      include: { inventory: true, images: true },
    });
  }
}
