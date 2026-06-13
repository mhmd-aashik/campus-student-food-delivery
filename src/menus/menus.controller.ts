import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { Request } from 'express';
import { Role } from '@/auth/enums/role.enum';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
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

@Controller('menus')
export class MenusController {
  constructor(protected readonly menusService: MenusService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  create(@Req() req: RequestWithUser, @Body() createDto: CreateMenuItemDto) {
    return this.menusService.createMenuItem(req.user!.id, createDto);
  }

  @Get()
  test() {
    return 'test';
  }
}
