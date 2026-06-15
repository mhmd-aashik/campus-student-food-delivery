/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Inject, Logger } from '@nestjs/common';
import { DRIZZLE } from '@/constants/database.constants';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { eq } from 'drizzle-orm';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    protected readonly jwtService: JwtService,
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: string;
      }>(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Join room for user-specific updates
      await client.join(`user:${payload.sub}`);

      // Join room for role-specific updates
      if (payload.role === 'DRIVER') {
        await client.join('drivers');
      } else if (payload.role === 'RESTAURANT') {
        await client.join('restaurants');
      }

      // find restaurant owned by user
      const [restaurant] = await this.db
        .select()
        .from(schema.restaurants)
        .where(eq(schema.restaurants.ownerId, payload.sub));

      if (restaurant) {
        await client.join(`restaurant:${restaurant.id}`);
        this.logger.log(
          `Restaurant client auto-joined room restaurant:${restaurant.id}`,
        );
      }

      this.logger.log(
        `Client connected: ${client.id} (user ${payload.sub}, role ${payload.role})`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Connection rejected for client ${client.id}: ${errorMsg}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
