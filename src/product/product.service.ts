import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Variant } from 'src/entities/variant.entity';
import { generateCombinationKey } from 'src/utils/generate-combination-keys';
import { Product } from 'src/entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Variant)
    private readonly variantRepo: Repository<Variant>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    return this.dataSource.transaction(async (manager) => {
      // Create product
      const product = manager.create(Product, {
        name: createProductDto.name,
        description: createProductDto.description,
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
}
