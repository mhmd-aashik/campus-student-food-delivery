import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CreateReviewDto } from './dto/create-review.dto';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('reviews')
export class ReviewsController {
  constructor(protected readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async createReview(
    @Req() req: RequestWithUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(req.user!.id, dto);
  }
}
