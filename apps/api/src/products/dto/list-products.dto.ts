import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListProductsDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100)
  limit = 12;

  @IsOptional() @IsIn(['name', 'price', 'createdAt'])
  sort = 'createdAt';

  @IsOptional() @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean()
  includeInactive = false;
}
