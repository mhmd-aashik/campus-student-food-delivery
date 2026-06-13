import { Controller } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('menus')
export class MenusController {
  constructor(protected readonly menusService: MenusService) {}
}
