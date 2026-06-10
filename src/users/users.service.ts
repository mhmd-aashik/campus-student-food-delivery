import { DRIZZLE } from '@/constants/database.constants';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
      columns: {
        passwordHash: false,
        refreshToken: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'CUSTOMER' | 'RESTAURANT' | 'DRIVER';
  }) {
    const user = await this.db.insert(schema.users).values(data).returning();

    return user;
  }

  async updateRefreshToken(id: string, refreshToken: string | null) {
    await this.db
      .update(schema.users)
      .set({ refreshToken })
      .where(eq(schema.users.id, id));
  }
}
