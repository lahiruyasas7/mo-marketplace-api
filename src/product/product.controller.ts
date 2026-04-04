import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { UploadService } from 'src/utils/uplaodToS3.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly uploadService: UploadService,
  ) {}

  //create product with variants
  @UseInterceptors(FileInterceptor('productImage'))
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new product with variants' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        productImage: {
          type: 'string',
          format: 'binary',
        },
        variants: {
          type: 'string',
          example: JSON.stringify([
            {
              options: { color: 'red', size: 'M' },
              price: 1200,
              stock: 10,
            },
          ]),
        },
      },
    },
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
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const productImageUrl = file
      ? await this.uploadService.uploadProductImage(file)
      : undefined;
    return this.productService.create(dto, productImageUrl);
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

  //get one product by productId
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  @ApiOkResponse({
    description: 'Product fetched successfully',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
        name: 'Sample Product',
        description: 'This is a sample product',
        variants: [
          {
            id: 'variant-uuid',
            name: 'Size M',
            price: 100,
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
