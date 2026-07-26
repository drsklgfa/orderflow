import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: ListProductsDto) { return this.products.list(query); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.products.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  create(@Body() dto: CreateProductDto) { return this.products.create(dto); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) { return this.products.update(id, dto); }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adjustStock(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustStockDto) { return this.products.adjustStock(id, dto); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.products.remove(id); }
}
