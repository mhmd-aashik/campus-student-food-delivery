import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { RestaurantModule } from '@/restaurant/restaurant.module';
import { RedisModule } from '@/redis/redis.module';

@Module({
  imports: [RestaurantModule, RedisModule],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
