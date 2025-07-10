import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService {
  private redisClient: RedisClientType;
  constructor(private configService: ConfigService) {
    const redisHost =
      this.configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = this.configService.get<string>('REDIS_PORT') || '6379';
    const redisPassword =
      this.configService.get<string>('REDIS_PASSWORD') || '';
    const redisUsername =
      this.configService.get<string>('REDIS_USERNAME') || '';

    this.redisClient = createClient({
      url: `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`,
    });

    this.redisClient.on('error', (err) =>
      console.error('Redis Client Error', err),
    );

    this.redisClient.connect().catch(console.error);
  }

  // Set cache data
  async set(key: string, value: any, ttl?: number) {
    if (ttl) {
      return await this.redisClient.set(key, JSON.stringify(value), {
        EX: ttl, // Set expiration time in seconds
      });
    } else {
      return await this.redisClient.set(key, JSON.stringify(value)); // No expiration
    }
  }

  // Get data from cache
  async get(key: string) {
    const cachedData = await this.redisClient.get(key);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    return null;
  }

  // Delete cache data
  async delete(key: string) {
    return await this.redisClient.del(key);
  }

  // Get keys by pattern
  async getKeysByPattern(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    const scanIterator = this.redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 1000,
    });

    for await (const key of scanIterator) {
      keys.push(key as string);
    }

    return keys;
  }

  // Clear cache by key pattern
  async clearCacheByPattern(pattern: string): Promise<{ message: string }> {
    const keys = await this.redisClient.keys(pattern); // Get all matching keys

    if (keys.length > 0) {
      await this.redisClient.del(keys); // Delete all matching keys
    }

    return { message: 'Cache pattern cleared successfully.' };
  }

  // Setting the list data
  async setList(key: string, value: any, ttl?: number): Promise<any> {
    return await this.redisClient.rPush(key, JSON.stringify(value));
  }

  // Getting the list data
  async getList(key: string): Promise<any[]> {
    const items = await this.redisClient.lRange(key, 0, -1);
    return items.map((item) => JSON.parse(item));
  }

  //Removing the first item from the list
  async removeFirstFromList(key: string): Promise<string | null> {
    const item = await this.redisClient.lPop(key);
    return item ? JSON.parse(item) : null;
  }

  // Get the first item from the list (without removing it)
  async peekFirstFromList(key: string): Promise<any | null> {
    const item = await this.redisClient.lIndex(key, 0);
    return item ? JSON.parse(item) : null;
  }

  // Get the first item in the list where a specific field matches a value
  async findFirstInListByField(key: string, value: any): Promise<any | null> {
    const items = await this.redisClient.lRange(key, 0, -1);

    for (const item of items) {
      try {
        const parsed = JSON.parse(item);
        if (
          parsed['engagementType'] === value.engagementType &&
          parsed['type'] === value.type
        ) {
          return parsed;
        }
      } catch (e) {
        console.error('Invalid JSON in Redis list:', item);
      }
    }

    return null;
  }

  //Deleting a single item from the list
  async deleteItemFromList(key: string, value: any) {
    return await this.redisClient.lRem(key, 1, JSON.stringify(value));
  }

  // Clear all cache entries
  async resetCache(): Promise<{ message: string }> {
    await this.redisClient.flushAll();

    return { message: 'Cache cleared successfully.' };
  }
}
