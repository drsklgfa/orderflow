import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @Min(-1_000_000)
  @Max(1_000_000)
  delta!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(240)
  reason!: string;
}
