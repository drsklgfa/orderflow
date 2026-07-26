import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'OF-CAM-007' })
  @IsString() @MinLength(3) @MaxLength(40)
  sku!: string;

  @ApiProperty({ example: 'Webcam Full HD' })
  @IsString() @MinLength(2) @MaxLength(140)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500)
  imageUrl?: string;

  @ApiProperty({ description: 'Preço em centavos', example: 29990 })
  @IsInt() @Min(1) @Max(100_000_000)
  priceInCents!: number;

  @ApiProperty({ example: 10 })
  @IsInt() @Min(0) @Max(1_000_000)
  stock!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  active?: boolean;
}
