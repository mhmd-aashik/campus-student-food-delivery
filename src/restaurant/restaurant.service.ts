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
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { eq } from 'drizzle-orm';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createRestaurant(ownerId: string, createDto: CreateRestaurantDto) {
    const existingRestaurant = await this.db.query.restaurants.findFirst({
      where: eq(schema.restaurants.ownerId, ownerId),
    });

    if (existingRestaurant) {
      throw new ConflictException(
        'A restaurant owner can only register one restaurant',
      );
    }

    const [restaurant] = await this.db
      .insert(schema.restaurants)
      .values({
        ownerId,
        ...createDto,
      })
      .returning();

    return restaurant;
  }

  async findAllRestaurants() {
    return this.db.query.restaurants.findMany({
      where: eq(schema.restaurants.isActive, true),
    });
  }

  async findRestaurantById(id: string) {
    const restaurant = await this.db.query.restaurants.findFirst({
      where: eq(schema.restaurants.id, id),
      with: {
        menus: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async updateRestaurant(
    id: string,
    ownerId: string,
    updateDto: UpdateRestaurantDto,
  ) {
    const restaurant = await this.db.query.restaurants.findFirst({
      where: eq(schema.restaurants.id, id),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You are not authorized to update this restaurant',
      );
    }

    const [updated] = await this.db
      .update(schema.restaurants)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      })
      .where(eq(schema.restaurants.id, id))
      .returning();

    return updated;
  }

  async deleteRestaurant(id: string, ownerId: string) {
    const restaurant = await this.db.query.restaurants.findFirst({
      where: eq(schema.restaurants.id, id),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You are not authorized to delete this restaurant',
      );
    }

    await this.db
      .delete(schema.restaurants)
      .where(eq(schema.restaurants.id, id));

    return {
      id,
      message: 'Restaurant deleted successfully',
    };
  }
}
