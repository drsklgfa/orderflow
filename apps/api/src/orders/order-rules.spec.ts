import { OrderStatus } from '@prisma/client';
import { calculateOrderTotal, canTransition } from './order-rules';

describe('order rules', () => {
  it('calcula o total sempre em centavos', () => {
    expect(calculateOrderTotal([
      { quantity: 2, unitPriceInCents: 1990 },
      { quantity: 1, unitPriceInCents: 5000 },
    ])).toBe(8980);
  });

  it('permite somente transições válidas', () => {
    expect(canTransition(OrderStatus.PENDING, OrderStatus.PAID)).toBe(true);
    expect(canTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPED)).toBe(true);
    expect(canTransition(OrderStatus.DELIVERED, OrderStatus.PENDING)).toBe(false);
    expect(canTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toBe(false);
  });
});
