import { IsOptional, IsNumberString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductsQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsNumberString()
  limit?: string = '10';

  @ApiPropertyOptional({ example: 'tshirt' })
  @IsOptional()
  @IsString()
  search?: string;
}