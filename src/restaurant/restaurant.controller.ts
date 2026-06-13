import { Controller } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

@Controller('restaurant')
export class RestaurantController {
  constructor(protected readonly restaurantService: RestaurantService) {}
}
