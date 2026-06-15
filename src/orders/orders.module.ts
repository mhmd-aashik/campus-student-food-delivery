import { CartsModule } from '@/carts/carts.module';
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderTransitionService } from './order-transition.service';
import { WebsocketModule } from '@/websocket/websocket.module';

@Module({
  imports: [CartsModule, WebsocketModule],
  providers: [OrdersService, OrderTransitionService],
  controllers: [OrdersController],
  exports: [OrdersService, OrderTransitionService],
})
export class OrdersModule {}
