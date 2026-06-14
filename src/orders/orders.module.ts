import { CartsModule } from '@/carts/carts.module';
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderTransitionService } from './order-transition.service';

@Module({
  imports: [CartsModule],
  providers: [OrdersService, OrderTransitionService],
  controllers: [OrdersController],
  exports: [OrdersService, OrderTransitionService],
})
export class OrdersModule {}
