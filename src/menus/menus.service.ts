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

@Injectable()
export class MenusService {
  constructor(
    @Inject(DRIZZLE)
    protected db: NodePgDatabase<typeof schema>,
    protected restaurantService: RestaurantService,
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
}
