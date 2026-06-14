import { Role } from '@/auth/enums/role.enum';
import { OrdersService } from '@/orders/orders.service';
import {
  ConflictException,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('payments')
export class PaymentsController {
  constructor(
    protected readonly paymentsService: PaymentsService,
    protected readonly ordersService: OrdersService,
  ) {}

  @Post('intent/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async createPaymentIntent(
    @Req() req: RequestWithUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const order = await this.ordersService.getOrderDetails(
      orderId,
      req.user!.id,
    );

    if (order.status !== 'PENDING' || order.paymentStatus !== 'PENDING') {
      throw new ConflictException(
        'Payment intent can only be created for pending orders with pending payment status',
      );
    }

    const { clientSecret, paymentIntentId } =
      await this.paymentsService.createPaymentIntent(
        order.id,
        order.totalAmount,
      );

    await this.ordersService.updatePaymentIntentId(order.id, paymentIntentId);

    return { clientSecret };
  }
}
