import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { OrderAssignmentService } from './order-assignment.service';

@Module({
  providers: [DriverService, OrderAssignmentService],
  controllers: [DriverController],
  exports: [DriverService, OrderAssignmentService],
})
export class DriverModule {}
