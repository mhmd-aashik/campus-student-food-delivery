import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { Role } from '@/auth/enums/role.enum';
import { Request } from 'express';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('restaurant')
export class RestaurantController {
  constructor(protected readonly restaurantService: RestaurantService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  create(@Req() req: RequestWithUser, @Body() createDto: CreateRestaurantDto) {
    return this.restaurantService.createRestaurant(req.user!.id, createDto);
  }
}
