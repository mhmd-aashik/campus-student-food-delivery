import { DRIZZLE } from '@/constants/database.constants';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { CartsService } from '@/carts/carts.service';
import { CheckoutDto } from './dto/checkout.dto';
import { desc, eq } from 'drizzle-orm';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
    protected readonly cartsService: CartsService,
    protected readonly websocketGateway: WebsocketGateway,
  ) {}

  async checkout(userId: string, checkoutDto: CheckoutDto) {
    const cart = await this.cartsService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new ConflictException('Your cart is empty');
    }

    const restaurantId = cart.items[0].menu.restaurantId;

    let totalAmount = 0;
    for (const item of cart.items) {
      if (!item.menu.isAvailable) {
        throw new ConflictException(
          `Menu item "${item.menu.name}" is no longer available`,
        );
      }
      totalAmount += item.quantity * item.menu.price;
    }

    const newOrder = await this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(schema.orders)
        .values({
          userId,
          restaurantId,
          totalAmount,
          deliveryAddress: checkoutDto.deliveryAddress,
          deliveryPhone: checkoutDto.deliveryPhone,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        })
        .returning();

      const orderItemsValues = cart.items.map((item) => ({
        orderId: order.id,
        menuId: item.menuId,
        quantity: item.quantity,
        priceAtOrder: item.menu.price,
      }));

      await tx.insert(schema.orderItems).values(orderItemsValues);

      await tx
        .delete(schema.cartItems)
        .where(eq(schema.cartItems.cartId, cart.id));

      return order;
    });

    return this.getOrderDetails(newOrder.id, userId);
  }

  async getOrderDetails(orderId: string, userId: string) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this order');
    }

    const items = await this.db
      .select({
        id: schema.orderItems.id,
        orderId: schema.orderItems.orderId,
        menuId: schema.orderItems.menuId,
        quantity: schema.orderItems.quantity,
        priceAtOrder: schema.orderItems.priceAtOrder,
        createdAt: schema.orderItems.createdAt,
        updatedAt: schema.orderItems.updatedAt,
        menu: {
          id: schema.menus.id,
          name: schema.menus.name,
          description: schema.menus.description,
          price: schema.menus.price,
          imageUrl: schema.menus.imageUrl,
        },
      })
      .from(schema.orderItems)
      .innerJoin(schema.menus, eq(schema.orderItems.menuId, schema.menus.id))
      .where(eq(schema.orderItems.orderId, orderId));

    return {
      ...order,
      items,
    };
  }

  async getOrderHistory(userId: string) {
    return this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.users.id, userId))
      .orderBy(desc(schema.orders.createdAt));
  }

  async updatePaymentIntentId(orderId: string, paymentIntentId: string) {
    const [updatedOrder] = await this.db
      .update(schema.orders)
      .set({
        stripePaymentIntentId: paymentIntentId,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId))
      .returning();

    if (updatedOrder) {
      // Broadcast status update to the customer
      this.websocketGateway.emitToRoom(
        `user:${updatedOrder.userId}`,
        'order_status_updated',
        {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
        },
      );

      // Notify the restaurant about the new confirmed order
      this.websocketGateway.emitToRoom(
        `restaurant:${updatedOrder.restaurantId}`,
        'new_order',
        updatedOrder,
      );
    }
  }

  async confirmPayment(orderId: string, stripePaymentIntentId: string) {
    await this.db
      .update(schema.orders)
      .set({
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        stripePaymentIntentId,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId));
  }

  async getOrderTracking(orderId: string, userId: string) {
    const order = await this.getOrderDetails(orderId, userId);

    if (!order.driverId) {
      throw new NotFoundException('No driver assigned to this order yet');
    }

    const [location] = await this.db
      .select()
      .from(schema.driverLocations)
      .where(eq(schema.driverLocations.driverId, order.driverId));

    if (!location) {
      throw new NotFoundException('Driver location not available yet');
    }

    return {
      orderId: order.id,
      status: order.status,
      driverId: order.driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.updatedAt,
    };
  }
}
