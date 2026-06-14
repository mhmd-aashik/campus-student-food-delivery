import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type StripeWebhookEvent = ReturnType<
  Stripe.Stripe['webhooks']['constructEvent']
>;

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe.Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_mock';
    this.stripe = new Stripe(secretKey);
  }

  async createPaymentIntent(orderId: string, amount: number) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          orderId,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new BadRequestException(`Stripe Error: ${err.message}`);
    }
  }

  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): StripeWebhookEvent {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        try {
          return (
            typeof payload === 'string'
              ? JSON.parse(payload)
              : JSON.parse(payload.toString())
          ) as StripeWebhookEvent;
        } catch {
          throw new BadRequestException('Invalid JSON payload');
        }
      }
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }
  }
}
