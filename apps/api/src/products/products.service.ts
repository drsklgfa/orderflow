import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsDto, admin = false) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(!admin || !query.includeInactive ? { active: true } : {}),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { sku: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput = query.sort === 'price'
      ? { priceInCents: query.order }
      : query.sort === 'name'
        ? { name: query.order }
        : { createdAt: query.order };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, skip: (query.page - 1) * query.limit, take: query.limit }),
      this.prisma.product.count({ where }),
    ]);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async findOne(id: string, admin = false) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null, ...(!admin ? { active: true } : {}) } });
    if (!product) throw new AppException('PRODUCT_NOT_FOUND', 'Produto não encontrado.', HttpStatus.NOT_FOUND);
    return product;
  }

  async create(dto: CreateProductDto) {
    const sku = dto.sku.trim().toUpperCase();
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: { ...dto, sku, name: dto.name.trim(), active: dto.active ?? true } });
      if (dto.stock > 0) await tx.stockMovement.create({ data: { productId: product.id, type: StockMovementType.ENTRY, quantity: dto.stock, reason: 'Estoque inicial do produto' } });
      return product;
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id, true);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.sku ? { sku: dto.sku.trim().toUpperCase() } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl.trim() || null } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id, true);
    await this.prisma.product.update({ where: { id }, data: { active: false, deletedAt: new Date() } });
  }

  async adjustStock(id: string, dto: AdjustStockDto) {
    if (dto.delta === 0) throw new AppException('INVALID_STOCK_DELTA', 'O ajuste de estoque não pode ser zero.');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.updateMany({ where: { id, deletedAt: null, stock: { gte: Math.max(0, -dto.delta) } }, data: { stock: { increment: dto.delta } } });
      if (updated.count === 0) throw new AppException('INSUFFICIENT_STOCK', 'O ajuste deixaria o estoque negativo.', HttpStatus.CONFLICT);
      await tx.stockMovement.create({ data: { productId: id, type: dto.delta > 0 ? StockMovementType.ENTRY : StockMovementType.ADJUSTMENT, quantity: dto.delta, reason: dto.reason.trim() } });
      return tx.product.findUniqueOrThrow({ where: { id } });
    });
  }
}
