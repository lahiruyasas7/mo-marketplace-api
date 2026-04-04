import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Variant } from 'src/entities/variant.entity';
import { generateCombinationKey } from 'src/utils/generate-combination-keys';
import { Product } from 'src/entities/product.entity';
import { GetProductsQueryDto } from './dto/get-products-query.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Variant)
    private readonly variantRepo: Repository<Variant>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto, productImageUrl?: string) {
    return this.dataSource.transaction(async (manager) => {
      // Create product
      const product = manager.create(Product, {
        name: createProductDto.name,
        description: createProductDto.description,
        productImageUrl: productImageUrl,
      });

      const savedProduct = await manager.save(product);

      const variantEntities: Variant[] = [];
      const seenKeys = new Set<string>();

      // Process variants
      for (const variantDto of createProductDto.variants) {
        const key = generateCombinationKey(variantDto.options);

        // Prevent duplicates in request itself
        if (seenKeys.has(key)) {
          throw new BadRequestException(`Duplicate variant in request: ${key}`);
        }
        seenKeys.add(key);

        //Check DB duplicate
        const exists = await manager.findOne(Variant, {
          where: {
            product_id: savedProduct.id,
            combination_key: key,
          },
        });

        if (exists) {
          throw new BadRequestException(`Variant already exists: ${key}`);
        }

        const variant = manager.create(Variant, {
          product_id: savedProduct.id,
          combination_key: key,
          options: variantDto.options,
          price: variantDto.price,
          stock: variantDto.stock,
        });

        variantEntities.push(variant);
      }

      // Save all variants
      await manager.save(Variant, variantEntities);

      // Return product with variants
      return {
        ...savedProduct,
        variants: variantEntities,
      };
    });
  }

  async findAll(query: GetProductsQueryDto) {
    try {
      const page = parseInt(query.page || '1', 10);
      const limit = Math.min(parseInt(query.limit || '10', 10), 50);
      const skip = (page - 1) * limit;

      const qb = this.productRepo
        .createQueryBuilder('product')
        .leftJoin('product.variants', 'variant')
        .select('product.id', 'id')
        .addSelect('product.name', 'name')
        .addSelect('product.description', 'description')
        .addSelect('product.productImageUrl', 'productImageUrl')
        .addSelect('COALESCE(MIN(variant.price), 0)', 'min_price')
        .addSelect('COALESCE(MAX(variant.price), 0)', 'max_price')
        .addSelect('COUNT(variant.id)', 'total_variants')
        .groupBy('product.id');

      //Search
      if (query.search) {
        qb.andWhere('LOWER(product.name) LIKE :search', {
          search: `%${query.search.toLowerCase()}%`,
        });
      }

      //Pagination
      qb.skip(skip).take(limit);

      const items = await qb.getRawMany();

      //Correct total count (no grouping issue)
      const totalQb = this.productRepo.createQueryBuilder('product');

      if (query.search) {
        totalQb.where('LOWER(product.name) LIKE :search', {
          search: `%${query.search.toLowerCase()}%`,
        });
      }

      const total = await totalQb.getCount();

      return {
        data: items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          productImageUrl: item.productImageUrl,
          min_price: Number(item.min_price),
          max_price: Number(item.max_price),
          total_variants: Number(item.total_variants),
        })),
        meta: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      //log error for debugging
      console.error('Error fetching products:', error);

      throw new InternalServerErrorException(
        'Failed to fetch products. Please try again later.',
      );
    }
  }

  async findOne(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['variants'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Filter active variants (optional but recommended)
    const variants = product.variants.filter((v) => v.is_active);

    // Build options map
    const optionsMap: Record<string, Set<string>> = {};

    for (const variant of variants) {
      for (const [key, value] of Object.entries(variant.options)) {
        if (!optionsMap[key]) {
          optionsMap[key] = new Set();
        }
        optionsMap[key].add(String(value));
      }
    }

    // Convert Set to Array
    const options = Object.fromEntries(
      Object.entries(optionsMap).map(([key, valueSet]) => [
        key,
        Array.from(valueSet),
      ]),
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      productImageUrl: product.productImageUrl,
      options,

      variants: variants.map((v) => ({
        id: v.id,
        combination_key: v.combination_key,
        options: v.options,
        price: Number(v.price),
        stock: v.stock,
        is_active: v.is_active,
      })),
    };
  }
}
