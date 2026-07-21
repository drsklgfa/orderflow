import { Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ListOrdersDto } from './dto/list-orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiCookieAuth('access_token')
@Controller('orders')
@UseGuards(JwtAuthGuard, CsrfGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'UUID gerado pelo cliente para impedir pedidos duplicados.' })
  checkout(@CurrentUser('sub') userId: string, @Headers('idempotency-key') key: string) { return this.orders.checkout(userId, key); }

  @Get('me')
  listMine(@CurrentUser('sub') userId: string, @Query() query: ListOrdersDto) { return this.orders.listMine(userId, query); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) { return this.orders.findOne(userId, id); }

  @Patch(':id/cancel')
  cancel(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) { return this.orders.cancelByCustomer(userId, id); }
}
