import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuickBuyDto } from './dto/quick-buy.dto';
import { Variant } from 'src/entities/variant.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Order } from 'src/entities/order.entity';

@Injectable()
export class OrderService {
  constructor(private readonly dataSource: DataSource) {}

  async quickBuy(userId: string, dto: QuickBuyDto) {
    return this.dataSource.transaction(async (manager) => {
      const { productId, variantId, quantity } = dto;

      // Lock the variant row to prevent race conditions
      const variant = await manager
        .createQueryBuilder(Variant, 'variant')
        .setLock('pessimistic_write') // prevents concurrent stock deduction
        .where('variant.id = :variantId', { variantId })
        .andWhere('variant.product_id = :productId', { productId })
        .getOne();

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      // Check stock
      if (variant.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${variant.stock}`,
        );
      }

      // Deduct stock atomically
      variant.stock -= quantity;
      await manager.save(Variant, variant);

      // Build order item (price snapshot at purchase time)
      const unitPrice = Number(variant.price);
      const orderItem = manager.create(OrderItem, {
        variant_id: variant.id,
        quantity,
        price: unitPrice,
        total: unitPrice * quantity,
      });

      // Build and persist order with user association
      const order = manager.create(Order, {
        user_id: userId,
        total_amount: orderItem.total,
        items: [orderItem],
      });

      const savedOrder = await manager.save(Order, order);

      return {
        message: 'Order placed successfully',
        orderId: savedOrder.id,
        total_amount: savedOrder.total_amount,
      };
    });
  }
}
