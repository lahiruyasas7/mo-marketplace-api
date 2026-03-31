import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateVariantDto {
  @ApiProperty({
    example: {
      color: 'red',
      size: 'M',
      material: 'cotton',
    },
    description: 'Dynamic variant attributes',
  })
  @IsObject()
  options: Record<string, any>;

  @ApiProperty({
    example: 1200,
    description: 'Price of the variant',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 10,
    description: 'Available stock quantity',
  })
  @IsNumber()
  @Min(0)
  stock: number;
}

export class CreateProductDto {
  @ApiProperty({
    example: 'Basic T-Shirt',
    description: 'Name of the product',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Comfortable cotton t-shirt',
    description: 'Optional product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [CreateVariantDto],
    description: 'List of product variants',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}
