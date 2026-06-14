import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { DRIZZLE } from '@/constants/database.constants';

@Injectable()
export class OrderAssignmentService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async assignOrderToDriver(orderId: string) {
    // 1. Fetch order
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.driverId) {
      throw new BadRequestException('Order already has a driver assigned');
    }

    // 2. Find an available driver
    const [availableDriver] = await this.db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.role, 'DRIVER'),
          eq(schema.users.isAvailable, true),
        ),
      )
      .limit(1);

    if (!availableDriver) {
      throw new BadRequestException('No available drivers found at the moment');
    }

    // 3. Assign driver to order and set driver as unavailable
    const updatedOrder = await this.db.transaction(async (tx) => {
      // Update order with driverId
      const [updatedOrderWithDriverId] = await tx
        .update(schema.orders)
        .set({
          driverId: availableDriver.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      // Set driver as unavailable
      await tx
        .update(schema.users)
        .set({
          isAvailable: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, availableDriver.id));

      return updatedOrderWithDriverId;
    });

    return updatedOrder;
  }
}
