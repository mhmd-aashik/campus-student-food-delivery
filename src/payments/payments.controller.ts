import { Role } from '@/auth/enums/role.enum';
import { OrdersService } from '@/orders/orders.service';
import {
  BadRequestException,
  ConflictException,
  Controller,
  Headers,
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

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const event = this.paymentsService.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;
      const paymentIntentId = paymentIntent.id;

      if (orderId && paymentIntentId) {
        await this.ordersService.confirmPayment(orderId, paymentIntentId);
      }
    }

    return { received: true };
  }
}
