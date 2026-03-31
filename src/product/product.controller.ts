import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  //create product with variants
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

  //get all products api with pagination and search
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all products',
    description:
      'Retrieve a paginated list of products with optional search filtering.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination (defaults to 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of products per page (defaults to 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'laptop',
    description: 'Search keyword to filter products by name or description',
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Laptop',
            description: 'A powerful laptop',
            price: 999.99,
          },
        ],
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async findAll(@Query() query: GetProductsQueryDto) {
    return this.productService.findAll(query);
  }
}
