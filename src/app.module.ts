import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/validation';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { RestaurantController } from './restaurant/restaurant.controller';
import { RestaurantService } from './restaurant/restaurant.service';
import { RestaurantModule } from './restaurant/restaurant.module';
import { MenusModule } from './menus/menus.module';
import { UploadthingController } from './uploadthing/uploadthing.controller';
import { UploadthingModule } from './uploadthing/uploadthing.module';
import { CartsModule } from './carts/carts.module';
import { OrdersService } from './orders/orders.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersModule } from './orders/orders.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    RestaurantModule,
    MenusModule,
    UploadthingModule,
    CartsModule,
    OrdersModule,
  ],
  controllers: [
    AppController,
    AuthController,
    RestaurantController,
    UploadthingController,
    OrdersController,
  ],
  providers: [AppService, AuthService, RestaurantService, OrdersService],
})
export class AppModule {}
