import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class ApiSecurityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (isPublic) return true;

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    // Check if the request headers contain apikey with the correct value
    const apiKey = req.headers['apikey'];
    const apiHost = req.headers['apihost'];
    if (
      apiKey === this.configService.get<string>('MEDSCROLL_API_KEY') &&
      apiHost === this.configService.get<string>('MEDSCROLL_API_HOST')
    )
      return true; // Allow access

    return false; // Deny access
  }
}
