import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Variant } from './variant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Optional: base price (can be overridden by variants)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  base_price?: number;

  @OneToMany(() => Variant, (variant) => variant.product, {
    cascade: true, // allows creating variants together with product
  })
  variants: Variant[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
