import { DRIZZLE } from '@/constants/database.constants';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class DriverService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async updateAvailability(driverId: string, isAvailable: boolean) {
    const [updatedUser] = await this.db
      .update(schema.users)
      .set({
        isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, driverId))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('Driver not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshToken, ...result } = updatedUser;
    return result;
  }

  async acceptDelivery(driverId: string, orderId: string) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.driverId !== driverId) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    return order;
  }

  async declineDelivery(driverId: string, orderId: string) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.driverId !== driverId) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.orders)
        .set({
          driverId: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId));

      await tx
        .update(schema.users)
        .set({
          isAvailable: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, driverId));
    });

    return { declined: true };
  }
}
