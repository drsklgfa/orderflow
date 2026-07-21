import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ListOrdersDto } from '../orders/dto/list-orders.dto';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { OrdersService } from '../orders/orders.service';
import { ListProductsDto } from '../products/dto/list-products.dto';
import { ProductsService } from '../products/products.service';
import { AdminService, AdminListDto } from './admin.service';

@ApiTags('Administration')
@ApiCookieAuth('access_token')
@Controller('admin')
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly orders: OrdersService,
    private readonly products: ProductsService,
  ) {}

  @Get('dashboard')
  dashboard() { return this.admin.dashboard(); }

  @Get('customers')
  customers(@Query() query: AdminListDto) { return this.admin.customers(query); }

  @Get('inventory/movements')
  movements(@Query() query: AdminListDto) { return this.admin.movements(query); }

  @Get('products')
  listProducts(@Query() query: ListProductsDto) { return this.products.list(query, true); }

  @Get('orders')
  listOrders(@Query() query: ListOrdersDto) { return this.orders.listAll(query); }

  @Get('orders/:id')
  order(@Param('id', ParseUUIDPipe) id: string) { return this.orders.findOne('', id, true); }

  @Patch('orders/:id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto) { return this.orders.updateStatus(id, dto.status); }
}
