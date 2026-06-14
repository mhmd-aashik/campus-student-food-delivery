import { DRIZZLE } from '@/constants/database.constants';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class DriverService {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async updateAvailability(driverId: string, isAvailable: boolean) {
    const [updatedUser] = await this.db
      .update(schema.users)
      .set({
        isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, driverId))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('Driver not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshToken, ...result } = updatedUser;
    return result;
  }
}
