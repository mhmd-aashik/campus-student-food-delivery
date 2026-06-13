import { DRIZZLE } from '@/constants/database.constants';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { eq } from 'drizzle-orm';

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
}
