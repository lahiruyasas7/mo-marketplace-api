import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('variants')
@Unique('UQ_PRODUCT_COMBINATION', ['product_id', 'combination_key'])
export class Variant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //Relation to Product
  @Column()
  product_id: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  //Unique combination identifier
  @Column({ length: 255 })
  @Index()
  combination_key: string;

  //Flexible attributes (color, size, etc.)
  @Column({ type: 'jsonb' })
  options: Record<string, any>;

  //Price per variant
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  //Inventory
  @Column({ type: 'int', default: 0 })
  stock: number;

  // Optional: SKU (good practice)
  @Column({ length: 100, nullable: true })
  sku?: string;

  // Optional: status
  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
