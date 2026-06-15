import { AuthModule } from '@/auth/auth.module';
import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [AuthModule],
  providers: [WebsocketGateway, DatabaseModule],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
