import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { OrderStatus } from './enums/order-status.enum';
import { DRIZZLE } from '@/constants/database.constants';

@Injectable()
export class OrderTransitionService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async transitionTo(orderId: string, targetStatus: OrderStatus) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const [updatedOrder] = await this.db
      .update(schema.orders)
      .set({
        status: targetStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId))
      .returning();

    return updatedOrder;
  }
}
