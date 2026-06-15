import { DRIZZLE } from '@/constants/database.constants';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { eq } from 'drizzle-orm';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createReview(userId: string, dto: CreateReviewDto) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.driverLocations, dto.orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to review this order',
      );
    }

    if (order.status !== 'DELIVERED') {
      throw new ConflictException('You can only review delivered orders');
    }

    const [existingReview] = await this.db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.orderId, dto.orderId));

    if (existingReview) {
      throw new ConflictException(
        'A review has already been submitted for this order',
      );
    }

    const [review] = await this.db
      .insert(schema.reviews)
      .values({
        userId,
        restaurantId: order.restaurantId,
        orderId: dto.orderId,
        rating: dto.rating,
        comment: dto.comment,
      })
      .returning();

    return review;
  }
}
