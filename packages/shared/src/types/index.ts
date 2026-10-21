import {
  UserRole,
  AccountStatus,
  VendorStatus,
  ProductStatus,
  PaymentStatus,
  OrderOverallStatus,
  VendorOrderStatus,
  DeliveryState,
} from '../constants';

export interface UserContext {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  vendorId?: string;
  deliveryPartnerId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ProductCatalogItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceMinor: number;
  compareAtPriceMinor?: number;
  sku: string;
  status: ProductStatus;
  isFeatured: boolean;
  vendor: {
    id: string;
    storeName: string;
    slug: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
  availableStock: number;
}

export interface CartVendorGroup {
  vendorId: string;
  vendorStoreName: string;
  items: Array<{
    cartItemId: string;
    productId: string;
    title: string;
    sku: string;
    unitPriceMinor: number;
    quantity: number;
    totalPriceMinor: number;
    imageUrl?: string;
    availableStock: number;
  }>;
  subtotalMinor: number;
}
