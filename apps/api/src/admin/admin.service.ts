import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class AdminListDto {
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100)
  limit = 20;

  @IsOptional() @IsString()
  search?: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [customers, activeProducts, lowStock, orders, revenue, recentOrders] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: Role.CUSTOMER, isActive: true } }),
      this.prisma.product.count({ where: { active: true, deletedAt: null } }),
      this.prisma.product.count({ where: { active: true, deletedAt: null, stock: { lte: 5 } } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ where: { status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] } }, _sum: { totalInCents: true } }),
      this.prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } }, items: true } }),
    ]);
    return { customers, activeProducts, lowStock, orders, revenueInCents: revenue._sum.totalInCents ?? 0, recentOrders };
  }

  async customers(query: AdminListDto) {
    const where: Prisma.UserWhereInput = {
      role: Role.CUSTOMER,
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { email: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: { id: true, name: true, email: true, isActive: true, createdAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
      this.prisma.user.count({ where }),
    ]);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async movements(query: AdminListDto) {
    const where: Prisma.StockMovementWhereInput = query.search ? { OR: [{ reason: { contains: query.search, mode: 'insensitive' } }, { product: { name: { contains: query.search, mode: 'insensitive' } } }] } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({ where, include: { product: { select: { id: true, sku: true, name: true } }, order: { select: { id: true, number: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }
}
