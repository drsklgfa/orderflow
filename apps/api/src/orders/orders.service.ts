import { HttpStatus, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, StockMovementType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { ListOrdersDto } from './dto/list-orders.dto';
import { allowedTransitions, calculateOrderTotal } from './order-rules';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, idempotencyKey: string) {
    const normalizedKey = idempotencyKey?.trim();
    if (!normalizedKey || normalizedKey.length < 16 || normalizedKey.length > 100) {
      throw new AppException('IDEMPOTENCY_KEY_REQUIRED', 'Envie uma chave Idempotency-Key válida.', HttpStatus.BAD_REQUEST);
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.checkoutTransaction(userId, normalizedKey);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
          if (attempt < 3) continue;
          throw new AppException('CHECKOUT_RETRY_FAILED', 'Não foi possível concluir o checkout. Tente novamente.', HttpStatus.CONFLICT);
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const existing = await this.prisma.checkoutKey.findUnique({
            where: { userId_key: { userId, key: normalizedKey } },
            include: { responseOrder: { include: { items: true } } },
          });
          if (existing?.responseOrder) return existing.responseOrder;
          throw new AppException('CHECKOUT_IN_PROGRESS', 'Este checkout já está sendo processado.', HttpStatus.CONFLICT);
        }

        throw error;
      }
    }

    throw new AppException('CHECKOUT_RETRY_FAILED', 'Não foi possível concluir o checkout. Tente novamente.', HttpStatus.CONFLICT);
  }

  async listMine(userId: string, query: ListOrdersDto) {
    const where: Prisma.OrderWhereInput = { userId, ...(query.status ? { status: query.status } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async findOne(userId: string, orderId: string, isAdmin = false) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...(!isAdmin ? { userId } : {}) },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!order) throw new AppException('ORDER_NOT_FOUND', 'Pedido não encontrado.', HttpStatus.NOT_FOUND);
    return order;
  }

  async cancelByCustomer(userId: string, orderId: string) {
    const order = await this.findOne(userId, orderId);
    if (order.status !== OrderStatus.PENDING) {
      throw new AppException('ORDER_CANNOT_BE_CANCELLED', 'Somente pedidos pendentes podem ser cancelados pelo cliente.', HttpStatus.CONFLICT);
    }
    return this.cancelAndRestock(orderId, 'Cancelamento solicitado pelo cliente', [OrderStatus.PENDING]);
  }

  async listAll(query: ListOrdersDto) {
    const where: Prisma.OrderWhereInput = query.status ? { status: query.status } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async updateStatus(orderId: string, next: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppException('ORDER_NOT_FOUND', 'Pedido não encontrado.', HttpStatus.NOT_FOUND);
    if (next === order.status) return order;

    if (next === OrderStatus.CANCELLED) {
      return this.cancelAndRestock(orderId, 'Cancelamento realizado pelo administrador', [OrderStatus.PENDING, OrderStatus.PAID]);
    }

    if (!allowedTransitions[order.status].includes(next)) {
      throw new AppException('INVALID_STATUS_TRANSITION', `Não é permitido alterar de ${order.status} para ${next}.`, HttpStatus.CONFLICT);
    }

    const changed = await this.prisma.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: next },
    });
    if (changed.count === 0) {
      throw new AppException('ORDER_STATUS_CHANGED', 'O pedido foi atualizado por outra operação. Recarregue e tente novamente.', HttpStatus.CONFLICT);
    }

    return this.findOne('', orderId, true);
  }

  private checkoutTransaction(userId: string, idempotencyKey: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const previous = await tx.checkoutKey.findUnique({
          where: { userId_key: { userId, key: idempotencyKey } },
          include: { responseOrder: { include: { items: true } } },
        });
        if (previous?.responseOrder) return previous.responseOrder;

        const cart = await tx.cart.findUnique({
          where: { userId },
          include: { items: { include: { product: true } } },
        });
        if (!cart?.items.length) {
          throw new AppException('EMPTY_CART', 'Adicione produtos ao carrinho antes de finalizar.', HttpStatus.CONFLICT);
        }

        await tx.checkoutKey.create({ data: { userId, key: idempotencyKey } });

        for (const item of cart.items) {
          if (!item.product.active || item.product.deletedAt) {
            throw new AppException('PRODUCT_UNAVAILABLE', `${item.product.name} não está mais disponível.`, HttpStatus.CONFLICT);
          }

          const reserved = await tx.product.updateMany({
            where: { id: item.productId, active: true, deletedAt: null, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (reserved.count === 0) {
            throw new AppException('OUT_OF_STOCK', `Estoque insuficiente para ${item.product.name}.`, HttpStatus.CONFLICT, {
              productId: item.productId,
              requested: item.quantity,
            });
          }
        }

        const totalInCents = calculateOrderTotal(
          cart.items.map((item) => ({ quantity: item.quantity, unitPriceInCents: item.product.priceInCents })),
        );

        const order = await tx.order.create({
          data: {
            number: this.orderNumber(),
            userId,
            totalInCents,
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                productSku: item.product.sku,
                unitPriceInCents: item.product.priceInCents,
                quantity: item.quantity,
                subtotalInCents: item.product.priceInCents * item.quantity,
              })),
            },
          },
          include: { items: true },
        });

        await tx.stockMovement.createMany({
          data: cart.items.map((item) => ({
            productId: item.productId,
            orderId: order.id,
            type: StockMovementType.SALE,
            quantity: -item.quantity,
            reason: `Venda ${order.number}`,
          })),
        });
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.checkoutKey.update({
          where: { userId_key: { userId, key: idempotencyKey } },
          data: { responseOrderId: order.id },
        });
        return order;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 },
    );
  }

  private async cancelAndRestock(orderId: string, reason: string, allowedStatuses: OrderStatus[]) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
            if (!order) throw new AppException('ORDER_NOT_FOUND', 'Pedido não encontrado.', HttpStatus.NOT_FOUND);
            if (order.status === OrderStatus.CANCELLED) return order;
            if (!allowedStatuses.includes(order.status)) {
              throw new AppException('INVALID_STATUS_TRANSITION', 'Este pedido não pode mais ser cancelado.', HttpStatus.CONFLICT);
            }

            const claimed = await tx.order.updateMany({
              where: { id: orderId, status: order.status },
              data: { status: OrderStatus.CANCELLED },
            });
            if (claimed.count === 0) {
              throw new AppException('ORDER_STATUS_CHANGED', 'O pedido foi atualizado por outra operação. Recarregue e tente novamente.', HttpStatus.CONFLICT);
            }

            for (const item of order.items) {
              await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
            }

            await tx.stockMovement.createMany({
              data: order.items.map((item) => ({
                productId: item.productId,
                orderId,
                type: StockMovementType.RETURN,
                quantity: item.quantity,
                reason,
              })),
            });

            return tx.order.findUniqueOrThrow({
              where: { id: orderId },
              include: { items: true, user: { select: { id: true, name: true, email: true } } },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 },
        );
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
          if (attempt < 3) continue;
          throw new AppException('ORDER_RETRY_FAILED', 'Não foi possível atualizar o pedido. Tente novamente.', HttpStatus.CONFLICT);
        }
        throw error;
      }
    }

    throw new AppException('ORDER_RETRY_FAILED', 'Não foi possível atualizar o pedido. Tente novamente.', HttpStatus.CONFLICT);
  }

  private orderNumber(): string {
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    return `ORD-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
