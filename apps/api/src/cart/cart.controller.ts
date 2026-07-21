import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

@ApiTags('Cart')
@ApiCookieAuth('access_token')
@Controller('cart')
@UseGuards(JwtAuthGuard, CsrfGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser('sub') userId: string) { return this.cart.get(userId); }

  @Post('items')
  add(@CurrentUser('sub') userId: string, @Body() dto: AddCartItemDto) { return this.cart.add(userId, dto); }

  @Patch('items/:productId')
  update(@CurrentUser('sub') userId: string, @Param('productId', ParseUUIDPipe) productId: string, @Body() dto: UpdateCartItemDto) { return this.cart.update(userId, productId, dto.quantity); }

  @Delete('items/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('sub') userId: string, @Param('productId', ParseUUIDPipe) productId: string) { return this.cart.remove(userId, productId); }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clear(@CurrentUser('sub') userId: string) { return this.cart.clear(userId); }
}
