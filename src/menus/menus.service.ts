import { DRIZZLE } from '@/constants/database.constants';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { RestaurantService } from '@/restaurant/restaurant.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { eq } from 'drizzle-orm';
import { RedisService } from '@/redis/redis.service';

@Injectable()
export class MenusService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
    protected readonly restaurantService: RestaurantService,
    protected readonly redisService: RedisService,
  ) {}

  async createMenuItem(ownerId: string, createDto: CreateMenuItemDto) {
    const restaurant = await this.restaurantService.findRestaurantById(
      createDto.restaurantId,
    );

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "You are not authorized to manage this restaurant's menu",
      );
    }

    const [menuItem] = await this.db
      .insert(schema.menus)
      .values(createDto)
      .returning();

    return menuItem;
  }

  async updateMenuItem(
    id: string,
    ownerId: string,
    updateDto: UpdateMenuItemDto,
  ) {
    const menuItem = await this.db.query.menus.findFirst({
      where: eq(schema.menus.id, id),
    });

    if (!menuItem || !menuItem.restaurantId) {
      throw new NotFoundException('Menu item not found');
    }

    const restaurant = await this.restaurantService.findRestaurantById(
      menuItem.restaurantId,
    );

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "You are not authorized to manage this restaurant's menu",
      );
    }

    const [updated] = await this.db
      .update(schema.menus)
      .set(updateDto)
      .where(eq(schema.menus.id, id))
      .returning();

    return updated;
  }

  async deleteMenuItem(id: string, ownerId: string) {
    const menuItem = await this.db.query.menus.findFirst({
      where: eq(schema.menus.id, id),
    });

    if (!menuItem || !menuItem.restaurantId) {
      throw new NotFoundException('Menu item not found');
    }

    const restaurant = await this.restaurantService.findRestaurantById(
      menuItem.restaurantId,
    );

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "You are not authorized to manage this restaurant's menu",
      );
    }

    await this.db.delete(schema.menus).where(eq(schema.menus.id, id));

    return { id, message: 'Menu item deleted successfully' };
  }

  async findByRestaurantId(restaurantId: string) {
    await this.restaurantService.findRestaurantById(restaurantId);

    const cacheKey = `restaurant:${restaurantId}:menus`;
    type MenuItem = typeof schema.menus.$inferSelect;
    const cached = await this.redisService.get<MenuItem[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const menuItem = await this.db.query.menus.findMany({
      where: eq(schema.menus.restaurantId, restaurantId),
    });

    await this.redisService.set(cacheKey, menuItem, 3600);
    return menuItem;
  }
}
