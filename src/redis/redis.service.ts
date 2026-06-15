import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly fallbackCache = new Map<string, string>();

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

    if (url && token) {
      try {
        this.client = new Redis({ url, token });
        this.logger.log('Upstash Redis client initialized successfully.');
      } catch (err) {
        this.logger.error('Failed to initialize Upstash Redis client:', err);
      }
    } else {
      this.logger.warn(
        'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Falling back to in-memory cache.',
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const val = await this.client.get<T>(key);
        return val;
      } catch (err) {
        this.logger.error(`Redis GET failed for key: ${key}`, err);
      }
    }

    const val = this.fallbackCache.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);

    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, { ex: ttlSeconds });
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        this.logger.error(`Redis SET failed for key: ${key}`, err);
      }
    }

    this.fallbackCache.set(key, strVal);
    if (ttlSeconds) {
      setTimeout(() => {
        this.fallbackCache.delete(key);
      }, ttlSeconds * 1000);
    }
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        this.logger.error(`Redis DEL failed for key: ${key}`, err);
      }
    }
    this.fallbackCache.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    if (this.client) {
      try {
        let cursor = 0;
        do {
          const [nextCursor, keys] = await this.client.scan(cursor, {
            match: pattern,
            count: 100,
          });
          cursor = Number(nextCursor);
          if (keys.length > 0) {
            await this.client.del(...keys);
          }
        } while (cursor !== 0);
        return;
      } catch (err) {
        this.logger.error(`Redis DEL pattern failed: ${pattern}`, err);
      }
    }

    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.fallbackCache.keys()) {
      if (regexPattern.test(key)) {
        this.fallbackCache.delete(key);
      }
    }
  }
}
