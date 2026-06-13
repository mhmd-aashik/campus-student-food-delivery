import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  Patch,
  Query,
  Get,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { Request } from 'express';
import { Role } from '@/auth/enums/role.enum';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('menus')
export class MenusController {
  constructor(protected readonly menusService: MenusService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  create(@Req() req: RequestWithUser, @Body() createDto: CreateMenuItemDto) {
    return this.menusService.createMenuItem(req.user!.id, createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
    @Body() updateDto: UpdateMenuItemDto,
  ) {
    return this.menusService.updateMenuItem(id, req.user!.id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.menusService.deleteMenuItem(id, req.user!.id);
  }

  @Get()
  findByRestaurantId(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
  ) {
    return this.menusService.findByRestaurantId(restaurantId);
  }
}
