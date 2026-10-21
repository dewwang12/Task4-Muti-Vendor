import { PrismaClient, Role, VendorStatus, ProductStatus, OrderOverallStatus, PaymentStatus, VendorOrderStatus, DeliveryState } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MarketHub database seed...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.commissionRecord.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.vendorOrder.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.deliveryPartnerProfile.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default passwords
  const passwordAdmin = await bcrypt.hash('Admin@123456', 10);
  const passwordVendor = await bcrypt.hash('Vendor@123456', 10);
  const passwordCustomer = await bcrypt.hash('Customer@123456', 10);
  const passwordRider = await bcrypt.hash('Rider@123456', 10);

  // 3. Seed Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@markethub.com',
      passwordHash: passwordAdmin,
      name: 'System Administrator',
      role: Role.ADMIN,
      phone: '+919876543210',
    },
  });

  const vendorUser1 = await prisma.user.create({
    data: {
      email: 'techstore@vendor.com',
      passwordHash: passwordVendor,
      name: 'Vikram Sharma',
      role: Role.VENDOR,
      phone: '+919876543211',
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      email: 'fashionhub@vendor.com',
      passwordHash: passwordVendor,
      name: 'Priya Mehta',
      role: Role.VENDOR,
      phone: '+919876543212',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash: passwordCustomer,
      name: 'John Doe',
      role: Role.CUSTOMER,
      phone: '+919876543213',
    },
  });

  const riderUser = await prisma.user.create({
    data: {
      email: 'rider1@delivery.com',
      passwordHash: passwordRider,
      name: 'Ramesh Patel',
      role: Role.DELIVERY_PARTNER,
      phone: '+919876543214',
    },
  });

  console.log('✅ Users created.');

  // 4. Seed Addresses
  const customerAddress = await prisma.address.create({
    data: {
      userId: customerUser.id,
      recipientName: 'John Doe',
      phone: '+919876543213',
      streetLine1: 'Flat 402, Green Valley Apts, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      isDefaultShipping: true,
      isDefaultBilling: true,
    },
  });

  // 5. Seed Vendor Profiles
  const vendor1 = await prisma.vendor.create({
    data: {
      userId: vendorUser1.id,
      storeName: 'AeroTech Electronics',
      slug: 'aerotech-electronics',
      description: 'Premium consumer audio, gadgets, and computing accessories.',
      logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&h=200&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=300&fit=crop',
      status: VendorStatus.APPROVED,
      commissionRateBps: 1000, // 10.00%
      businessEmail: 'contact@aerotech.in',
      businessPhone: '+919876543211',
      bankAccountNumber: '98765432101234',
      bankIfscCode: 'HDFC0001234',
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      userId: vendorUser2.id,
      storeName: 'UrbanCraft Apparel',
      slug: 'urbancraft-apparel',
      description: 'Handcrafted premium leather accessories, modern fashion & apparel.',
      logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=300&fit=crop',
      status: VendorStatus.APPROVED,
      commissionRateBps: 1200, // 12.00%
      businessEmail: 'support@urbancraft.in',
      businessPhone: '+919876543212',
      bankAccountNumber: '12345678909876',
      bankIfscCode: 'ICIC0005678',
    },
  });

  // 6. Seed Delivery Partner Profile
  const riderProfile = await prisma.deliveryPartnerProfile.create({
    data: {
      userId: riderUser.id,
      vehicleType: 'EV Scooter',
      licenseNumber: 'KA-01-2023-0004921',
    },
  });

  console.log('✅ Vendors & Delivery profiles created.');

  // 7. Seed Categories
  const catElectronics = await prisma.category.create({
    data: {
      name: 'Electronics & Audio',
      slug: 'electronics-audio',
      description: 'High fidelity audio, wireless headphones, and everyday gadgets',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    },
  });

  const catFashion = await prisma.category.create({
    data: {
      name: 'Fashion & Bags',
      slug: 'fashion-bags',
      description: 'Artisanal bags, wallets, backpacks, and sustainable apparel',
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    },
  });

  const catHome = await prisma.category.create({
    data: {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Modern minimalist home workspace and aesthetic decor',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
    },
  });

  // 8. Seed Products with Inventory & Images
  // Product 1: Headphones (Vendor 1)
  const product1 = await prisma.product.create({
    data: {
      vendorId: vendor1.id,
      categoryId: catElectronics.id,
      title: 'AeroPulse ANC Wireless Headphones',
      slug: 'aeropulse-anc-wireless-headphones',
      description: 'Industry-leading 40dB Hybrid Active Noise Cancellation with 50-hour battery life and ultra-comfortable memory foam ear cushions.',
      priceMinor: 499900, // ₹4,999.00
      compareAtPriceMinor: 699900, // ₹6,999.00
      sku: 'AERO-ANC-001',
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
            key: 'products/aero-anc-1.jpg',
            sortOrder: 0,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 25,
          reservedQuantity: 0,
          lowStockThreshold: 5,
        },
      },
    },
  });

  // Product 2: Mechanical Keyboard (Vendor 1)
  const product2 = await prisma.product.create({
    data: {
      vendorId: vendor1.id,
      categoryId: catElectronics.id,
      title: 'ApexGlide Wireless Mechanical Keyboard',
      slug: 'apexglide-wireless-mechanical-keyboard',
      description: 'Compact 75% hot-swappable mechanical keyboard with pre-lubed linear switches, RGB backlighting, and Bluetooth 5.2 connectivity.',
      priceMinor: 349900, // ₹3,499.00
      compareAtPriceMinor: 449900,
      sku: 'AERO-KEY-002',
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
            key: 'products/apex-key-1.jpg',
            sortOrder: 0,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 18,
          reservedQuantity: 0,
          lowStockThreshold: 4,
        },
      },
    },
  });

  // Product 3: Leather Backpack (Vendor 2)
  const product3 = await prisma.product.create({
    data: {
      vendorId: vendor2.id,
      categoryId: catFashion.id,
      title: 'Heritage Full-Grain Leather Commuter Backpack',
      slug: 'heritage-leather-commuter-backpack',
      description: 'Handcrafted from vegetable-tanned Italian leather with dedicated 16-inch laptop compartment, brass hardware, and ergonomic padded straps.',
      priceMinor: 599900, // ₹5,999.00
      compareAtPriceMinor: 799900,
      sku: 'UC-BAG-101',
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
            key: 'products/heritage-bag-1.jpg',
            sortOrder: 0,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 12,
          reservedQuantity: 0,
          lowStockThreshold: 3,
        },
      },
    },
  });

  // Product 4: Minimalist Leather Wallet (Vendor 2)
  const product4 = await prisma.product.create({
    data: {
      vendorId: vendor2.id,
      categoryId: catFashion.id,
      title: 'UrbanSlim RFID Blocking Bifold Wallet',
      slug: 'urbanslim-rfid-bifold-wallet',
      description: 'Ultra-slim genuine leather wallet featuring RFID blocking shields, quick-access card slots, and integrated cash strap.',
      priceMinor: 129900, // ₹1,299.00
      compareAtPriceMinor: 179900,
      sku: 'UC-WAL-102',
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
            key: 'products/wallet-1.jpg',
            sortOrder: 0,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 40,
          reservedQuantity: 0,
          lowStockThreshold: 8,
        },
      },
    },
  });

  console.log('✅ Products & Inventories created.');

  // 9. Seed a Completed Multi-Vendor Demonstration Order
  // Customer bought 1x Headphones (Vendor 1) + 1x Wallet (Vendor 2)
  const subtotalVendor1 = 499900;
  const subtotalVendor2 = 129900;
  const totalAmount = subtotalVendor1 + subtotalVendor2; // ₹6,298.00

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'MH-2026-10001',
      customerId: customerUser.id,
      shippingAddressSnapshot: {
        recipientName: 'John Doe',
        phone: '+919876543213',
        streetLine1: 'Flat 402, Green Valley Apts, MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      billingAddressSnapshot: {
        recipientName: 'John Doe',
        streetLine1: 'Flat 402, Green Valley Apts, MG Road',
        city: 'Bengaluru',
        postalCode: '560001',
      },
      totalAmountMinor: totalAmount,
      itemsSubtotalMinor: totalAmount,
      shippingFeeMinor: 0,
      paymentStatus: PaymentStatus.PAID,
      overallStatus: OrderOverallStatus.PROCESSING,
      paymentMethod: 'MOCK_CARD',
      payments: {
        create: {
          provider: 'MOCK',
          providerPaymentId: 'mock_pay_99887766',
          amountMinor: totalAmount,
          currency: 'INR',
          status: PaymentStatus.PAID,
        },
      },
    },
  });

  // Vendor 1 Sub-Order (Commission 10%)
  const commV1 = Math.round((subtotalVendor1 * 1000) / 10000); // ₹499.90 -> 49990 paise
  const payoutV1 = subtotalVendor1 - commV1; // 449910 paise
  const vendorOrder1 = await prisma.vendorOrder.create({
    data: {
      subOrderNumber: 'MH-2026-10001-V1',
      orderId: sampleOrder.id,
      vendorId: vendor1.id,
      subtotalMinor: subtotalVendor1,
      commissionRateBps: 1000,
      platformCommissionMinor: commV1,
      vendorPayoutMinor: payoutV1,
      status: VendorOrderStatus.READY_FOR_PICKUP,
      items: {
        create: [
          {
            productId: product1.id,
            titleSnapshot: product1.title,
            skuSnapshot: product1.sku,
            unitPriceMinor: product1.priceMinor,
            quantity: 1,
            totalPriceMinor: product1.priceMinor,
          },
        ],
      },
      commissionRecord: {
        create: {
          grossAmountMinor: subtotalVendor1,
          commissionRateBps: 1000,
          commissionAmountMinor: commV1,
          netVendorAmountMinor: payoutV1,
          isSettled: false,
        },
      },
      delivery: {
        create: {
          deliveryPartnerId: riderProfile.id,
          trackingCode: 'TRK-MH-10001-V1',
          status: DeliveryState.ASSIGNED,
          recipientName: 'John Doe',
          recipientPhone: '+919876543213',
          deliveryAddress: 'Flat 402, Green Valley Apts, MG Road, Bengaluru 560001',
          history: {
            create: [
              {
                status: DeliveryState.PENDING_ASSIGNMENT,
                note: 'Order placed and delivery requested',
              },
              {
                status: DeliveryState.ASSIGNED,
                note: 'Assigned to delivery partner Ramesh Patel (EV Scooter)',
              },
            ],
          },
        },
      },
    },
  });

  // Vendor 2 Sub-Order (Commission 12%)
  const commV2 = Math.round((subtotalVendor2 * 1200) / 10000); // 15588 paise
  const payoutV2 = subtotalVendor2 - commV2; // 114312 paise
  const vendorOrder2 = await prisma.vendorOrder.create({
    data: {
      subOrderNumber: 'MH-2026-10001-V2',
      orderId: sampleOrder.id,
      vendorId: vendor2.id,
      subtotalMinor: subtotalVendor2,
      commissionRateBps: 1200,
      platformCommissionMinor: commV2,
      vendorPayoutMinor: payoutV2,
      status: VendorOrderStatus.CONFIRMED,
      items: {
        create: [
          {
            productId: product4.id,
            titleSnapshot: product4.title,
            skuSnapshot: product4.sku,
            unitPriceMinor: product4.priceMinor,
            quantity: 1,
            totalPriceMinor: product4.priceMinor,
          },
        ],
      },
      commissionRecord: {
        create: {
          grossAmountMinor: subtotalVendor2,
          commissionRateBps: 1200,
          commissionAmountMinor: commV2,
          netVendorAmountMinor: payoutV2,
          isSettled: false,
        },
      },
      delivery: {
        create: {
          trackingCode: 'TRK-MH-10001-V2',
          status: DeliveryState.PENDING_ASSIGNMENT,
          recipientName: 'John Doe',
          recipientPhone: '+919876543213',
          deliveryAddress: 'Flat 402, Green Valley Apts, MG Road, Bengaluru 560001',
          history: {
            create: [
              {
                status: DeliveryState.PENDING_ASSIGNMENT,
                note: 'Order confirmed by UrbanCraft Apparel. Awaiting dispatch assignment.',
              },
            ],
          },
        },
      },
    },
  });

  // 10. Seed a Verified Review
  await prisma.review.create({
    data: {
      productId: product1.id,
      customerId: customerUser.id,
      rating: 5,
      comment: 'Incredible soundstage and ANC quality! Noise cancellation works wonders in noisy coffee shops.',
      isVerifiedPurchase: true,
      isApproved: true,
    },
  });

  // 11. Seed Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: Role.ADMIN,
      action: 'VENDOR_APPROVAL',
      entityName: 'Vendor',
      entityId: vendor1.id,
      metadata: {
        storeName: vendor1.storeName,
        approvedCommissionBps: vendor1.commissionRateBps,
      },
    },
  });

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
