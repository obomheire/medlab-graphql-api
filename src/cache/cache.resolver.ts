import { Args, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UseGuards } from '@nestjs/common';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { PermissionsType } from 'src/user/enum/user.enum';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { CacheService } from './cache.service';
import { MessageRes } from 'src/auth/types/auth.types';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Permissions(PermissionsType.SUPER_ADMIN)
@Resolver()
export class CacheResolver {
  constructor(private readonly cacheService: CacheService) {}

  // Clear all cache entries
  @Query(() => MessageRes)
  async resetCache() {
    return await this.cacheService.resetCache();
  }

  // Clear cache by key pattern
  @Query(() => MessageRes)
  async clearCacheByPattern(@Args('pattern') pattern: string) {
    return await this.cacheService.clearCacheByPattern(pattern);
  }
}
