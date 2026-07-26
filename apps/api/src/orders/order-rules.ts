import { OrderStatus } from '@prisma/client';

export type PricedItem = { quantity: number; unitPriceInCents: number };

export function calculateOrderTotal(items: PricedItem[]): number {
  return items.reduce((total, item) => total + item.quantity * item.unitPriceInCents, 0);
}

export const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}
