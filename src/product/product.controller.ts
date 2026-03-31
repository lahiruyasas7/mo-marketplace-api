import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new product with variants' })
  @ApiBody({
    type: CreateProductDto,
    description: 'Product with variants payload',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Duplicate variant or invalid input',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized (missing or invalid JWT)',
  })
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
}
