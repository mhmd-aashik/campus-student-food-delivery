import { DRIZZLE } from '@/constants/database.constants';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { RestaurantService } from '@/restaurant/restaurant.service';

@Injectable()
export class MenusService {
  constructor(
    @Inject(DRIZZLE)
    protected db: NodePgDatabase<typeof schema>,
    protected restaurantService: RestaurantService,
  ) {}
}
