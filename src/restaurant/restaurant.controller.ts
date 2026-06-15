import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { Role } from '@/auth/enums/role.enum';
import { Request } from 'express';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('restaurants')
export class RestaurantController {
  constructor(protected readonly restaurantService: RestaurantService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  create(@Req() req: RequestWithUser, @Body() createDto: CreateRestaurantDto) {
    return this.restaurantService.createRestaurant(req.user!.id, createDto);
  }

  @Get()
  findAll() {
    return this.restaurantService.findAllRestaurants();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantService.findRestaurantById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
    @Body() updateDto: UpdateRestaurantDto,
  ) {
    return this.restaurantService.updateRestaurant(id, req.user!.id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.restaurantService.deleteRestaurant(id, req.user!.id);
  }
}
