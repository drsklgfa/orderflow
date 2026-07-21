import { OrderStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListOrdersDto {
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100)
  limit = 20;

  @IsOptional() @IsEnum(OrderStatus)
  status?: OrderStatus;
}
