import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '@/orders/orders.module';
import { PaymentsService } from './payments.service';

@Module({
  imports: [OrdersModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
