export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

export interface Category {
  id: string;
  name: string;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  images: string[];
  videoUrl?: string; // Link or direct URL
  packages: { name: string; price: number }[];
  createdAt: any;
  updatedAt: any;
}

export interface Order {
  id: string;
  userId?: string;
  productId: string;
  productName: string;
  package?: string;
  price: number;
  customerName?: string;
  mobileNumber: string;
  address?: string;
  status: OrderStatus;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: string;
  isPlaceholder?: boolean;
}
