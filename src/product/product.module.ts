import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/entities/product.entity';
import { Variant } from 'src/entities/variant.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UploadService } from 'src/utils/uplaodToS3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Variant]), AuthModule],
  controllers: [ProductController],
  providers: [ProductService, UploadService],
})
export class ProductModule {}
