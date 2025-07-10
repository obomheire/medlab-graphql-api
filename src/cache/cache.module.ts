import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheResolver } from './cache.resolver';

@Global()
@Module({
  providers: [CacheResolver, CacheService],
  exports: [CacheService],
})
export class CacheModule {}
