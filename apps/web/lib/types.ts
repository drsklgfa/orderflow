export type Role = 'ADMIN' | 'CUSTOMER';
export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type User = { id: string; name: string; email: string; role: Role; createdAt: string };
export type Product = { id: string; sku: string; name: string; description?: string; imageUrl?: string; priceInCents: number; stock: number; active: boolean; createdAt: string };
export type CartItem = { id: string; productId: string; quantity: number; product: Product; subtotalInCents: number };
export type Cart = { id: string; items: CartItem[]; totalItems: number; totalInCents: number; updatedAt: string };
export type OrderItem = { id: string; productId: string; productName: string; productSku: string; unitPriceInCents: number; quantity: number; subtotalInCents: number };
export type Order = { id: string; number: string; status: OrderStatus; totalInCents: number; createdAt: string; items: OrderItem[]; user?: { name: string; email: string } };
export type Paginated<T> = { items: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };
