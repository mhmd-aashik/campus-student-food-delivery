import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { DRIZZLE } from '@/constants/database.constants';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        const connectionString =
          configService.getOrThrow<string>('DATABASE_URL');
        const pool = new Pool({
          connectionString,
          ssl: connectionString.includes('neon.tech')
            ? { rejectUnauthorized: false }
            : undefined,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
