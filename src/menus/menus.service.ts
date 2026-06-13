import { DRIZZLE } from '@/constants/database.constants';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { RestaurantService } from '@/restaurant/restaurant.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';

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
}
