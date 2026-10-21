import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Ergonomic Mouse' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'High precision wireless mouse with 4000 DPI and silent click buttons.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 199900, description: 'Price in integer minor units (paise)' })
  @IsInt()
  @Min(1)
  priceMinor: number;

  @ApiPropertyOptional({ example: 299900 })
  @IsOptional()
  @IsInt()
  compareAtPriceMinor?: number;

  @ApiProperty({ example: 'TECH-MOU-003' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'cat_electronics_id' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number = 0;

  @ApiPropertyOptional({ type: [String], example: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];
}
