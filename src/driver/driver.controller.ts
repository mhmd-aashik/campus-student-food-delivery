import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('driver')
export class DriverController {
  constructor(protected readonly driverService: DriverService) {}

  @Patch('availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  async updateAvailability(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.driverService.updateAvailability(req.user!.id, dto.isAvailable);
  }

  @Post('orders/:orderId/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  async acceptDelivery(
    @Req() req: RequestWithUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.driverService.acceptDelivery(req.user!.id, orderId);
  }

  @Post('orders/:orderId/decline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  async declineDelivery(
    @Req() req: RequestWithUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.driverService.declineDelivery(req.user!.id, orderId);
  }
}
