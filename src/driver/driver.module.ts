import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { OrderAssignmentService } from './order-assignment.service';
import { WebsocketModule } from '@/websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  providers: [DriverService, OrderAssignmentService],
  controllers: [DriverController],
  exports: [DriverService, OrderAssignmentService],
})
export class DriverModule {}
