import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Variant } from './variant.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  variant_id: string;

  @ManyToOne(() => Variant)
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @ManyToOne(() => Order, (order) => order.items)
  order: Order;

  @Column()
  quantity: number;

  @Column({ type: 'numeric' })
  price: number; // snapshot price

  @Column({ type: 'numeric' })
  total: number;
}