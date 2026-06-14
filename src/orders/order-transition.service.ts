import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { OrderStatus } from './enums/order-status.enum';
import { DRIZZLE } from '@/constants/database.constants';

@Injectable()
export class OrderTransitionService {
  private readonly validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.PICKED_UP],
    [OrderStatus.PICKED_UP]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

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

    const currentStatus = order.status as OrderStatus;
    const allowedTransitions = this.validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${targetStatus}`,
      );
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
