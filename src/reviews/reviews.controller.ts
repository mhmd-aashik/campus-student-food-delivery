import { Controller } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(protected readonly reviewsService: ReviewsService) {}
}
