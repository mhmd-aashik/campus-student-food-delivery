import { Role } from '@/auth/enums/role.enum';
import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartsService } from './carts.service';
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

@Controller('carts')
export class CartsController {
  constructor(protected readonly cartsService: CartsService) {}

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  addItem(@Req() req: RequestWithUser, @Body() addDto: AddToCartDto) {
    return this.cartsService.addItem(req.user!.id, addDto);
  }

  @Delete('items/:menuId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  removeItem(
    @Req() req: RequestWithUser,
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Query('quantity') quantityStr?: string,
  ) {
    const quantity = quantityStr ? parseInt(quantityStr, 10) : undefined;
    return this.cartsService.removeItem(req.user!.id, menuId, quantity);
  }
}
