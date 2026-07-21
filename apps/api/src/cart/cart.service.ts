import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { orderBy: { createdAt: 'asc' }, include: { product: true } } },
    });
    return this.present(cart);
  }

  async add(userId: string, dto: AddCartItemDto) {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: dto.productId, active: true, deletedAt: null } });
      if (!product) throw new AppException('PRODUCT_NOT_FOUND', 'Produto não encontrado.', HttpStatus.NOT_FOUND);
      const cart = await tx.cart.upsert({ where: { userId }, update: {}, create: { userId } });
      const existing = await tx.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId: product.id } } });
      const requested = (existing?.quantity ?? 0) + dto.quantity;
      if (requested > product.stock) throw new AppException('INSUFFICIENT_STOCK', 'Quantidade maior que o estoque disponível.', HttpStatus.CONFLICT, { available: product.stock, requested });
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } },
        update: { quantity: requested },
        create: { cartId: cart.id, productId: product.id, quantity: dto.quantity },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return this.get(userId);
  }

  async update(userId: string, productId: string, quantity: number) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppException('CART_NOT_FOUND', 'Carrinho não encontrado.', HttpStatus.NOT_FOUND);
    const item = await this.prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } }, include: { product: true } });
    if (!item) throw new AppException('CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.', HttpStatus.NOT_FOUND);
    if (!item.product.active || item.product.deletedAt) throw new AppException('PRODUCT_UNAVAILABLE', 'Este produto não está mais disponível.', HttpStatus.CONFLICT);
    if (quantity > item.product.stock) throw new AppException('INSUFFICIENT_STOCK', 'Quantidade maior que o estoque disponível.', HttpStatus.CONFLICT, { available: item.product.stock, requested: quantity });
    await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return this.get(userId);
  }

  async remove(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  }

  async clear(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  private present(cart: any) {
    const items = cart.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
      subtotalInCents: item.quantity * item.product.priceInCents,
    }));
    return { id: cart.id, items, totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0), totalInCents: items.reduce((sum: number, item: any) => sum + item.subtotalInCents, 0), updatedAt: cart.updatedAt };
  }
}
