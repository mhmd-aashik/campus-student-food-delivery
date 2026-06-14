import { Role } from '@/auth/enums/role.enum';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { Roles } from '@/auth/decorators/roles.decorator';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('orders')
export class OrdersController {
  constructor(protected readonly ordersService: OrdersService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  checkout(@Req() req: RequestWithUser, @Body() checkoutDto: CheckoutDto) {
    return this.ordersService.checkout(req.user!.id, checkoutDto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.RESTAURANT, Role.DRIVER)
  getOrderHistory(@Req() req: RequestWithUser) {
    return this.ordersService.getOrderHistory(req.user!.id);
  }
}
