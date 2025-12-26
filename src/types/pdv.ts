export enum ProductCategory {
  CHOPP = "CHOPP",
  FOOD = "FOOD",
  DRINK = "DRINK",
  OTHER = "OTHER",
}

export type Product = {
  id: string;
  name: string;
  description?: string;
  sellingPrice: number;
  unitOfMeasure: string;
  category: ProductCategory;
  stock: number;
  minStockLevel: number;
  batch?: string;
  expiryDate?: string; // DateTime? in Prisma -> string | Date | undefined
  createdAt: string;
  updatedAt: string;
  imageUrl?: string | null;
};

export enum OrderStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  isCourtesy: boolean;
  createdAt: string;
  orderId: string;
  productId: string;
  product: Product; // Full product relation
};

// Minimal User type for relations within this file. The full User type should be imported from users.ts or similar.
export type User = {
  id: string;
  name: string;
};

export enum PaymentMethod {
  CASH = "CASH",
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
  PIX = "PIX",
}

export type Payment = {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  orderId: string;
  cashierId: string;
};

export type Cashier = {
  id: string;
  openingDate: string;
  closingDate?: string;
  initialAmount: number;
  finalAmount?: number;
  openedById: string;
  openedBy: User;
  payments: Payment[];
  detailsJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  tableId: number;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tip: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  waiterId: string;
  waiter: User;
  items: OrderItem[];
  payments: Payment[];
};