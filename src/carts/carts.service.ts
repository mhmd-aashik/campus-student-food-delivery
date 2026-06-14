import { DRIZZLE } from '@/constants/database.constants';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { and, eq } from 'drizzle-orm';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartsService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.db.query.carts.findFirst({
      where: eq(schema.carts.userId, userId),
    });

    if (!cart) {
      const [newCart] = await this.db
        .insert(schema.carts)
        .values({ userId })
        .returning();
      cart = newCart;
    }

    return cart;
  }

  async addItem(userId: string, addDto: AddToCartDto) {
    const menuItem = await this.db.query.menus.findFirst({
      where: eq(schema.menus.id, addDto.menuId),
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (!menuItem?.isAvailable) {
      throw new ConflictException('Menu item is currently no unavailable');
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItems = await this.db
      .select({
        id: schema.cartItems.id,
        cartId: schema.cartItems.cartId,
        menuId: schema.cartItems.menuId,
        quantity: schema.cartItems.quantity,
        menu: {
          restaurantId: schema.menus.restaurantId,
        },
      })
      .from(schema.cartItems)
      .innerJoin(schema.menus, eq(schema.cartItems.menuId, schema.menus.id))
      .where(eq(schema.cartItems.cartId, cart.id));

    if (existingItems.length > 0) {
      const activeRestaurantId = existingItems[0].menu.restaurantId;
      if (activeRestaurantId !== menuItem.restaurantId) {
        throw new ConflictException(
          'Your cart contains items from a different restaurant. Please clear your cart first.',
        );
      }
    }

    const existingCartItem = existingItems.find(
      (item) => item.menuId === addDto.menuId,
    );

    if (existingCartItem) {
      const [updatedItem] = await this.db
        .update(schema.cartItems)
        .set({
          quantity: existingCartItem.quantity + addDto.quantity,
          updateAt: new Date(),
        })
        .where(eq(schema.cartItems.id, existingCartItem.id))
        .returning();
      return updatedItem;
    } else {
      const [newItem] = await this.db
        .insert(schema.cartItems)
        .values({
          cartId: cart.id,
          menuId: addDto.menuId,
          quantity: addDto.quantity,
        })
        .returning();
      return newItem;
    }
  }

  async removeItem(userId: string, menuId: string, quantity?: number) {
    const cart = await this.getOrCreateCart(userId);

    const [existingCartItem] = await this.db
      .select()
      .from(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.cartId, cart.id),
          eq(schema.cartItems.menuId, menuId),
        ),
      );

    if (!existingCartItem) {
      throw new NotFoundException('Item not found in cart');
    }

    if (quantity && quantity < existingCartItem.quantity) {
      const [updatedItem] = await this.db
        .update(schema.cartItems)
        .set({
          quantity: existingCartItem.quantity - quantity,
          updateAt: new Date(),
        })
        .where(eq(schema.cartItems.id, existingCartItem.id))
        .returning();
      return updatedItem;
    } else {
      await this.db
        .delete(schema.cartItems)
        .where(eq(schema.cartItems.id, existingCartItem.id));
      return { message: 'Item removed from cart' };
    }
  }
}
