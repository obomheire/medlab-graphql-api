import { CanActivate, Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PermissionsType } from '../enum/user.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Convert the GraphQL context to the HTTP context
    const ctx = GqlExecutionContext.create(context).getContext();

    // Get the permissions metadata from the route handler
    const permissions = this.reflector.getAllAndOverride<PermissionsType[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!permissions) {
      return true;
    }

    // Retrieve the user object from the request (e.g., from JWT)
    const { user } = ctx.req;

    // Allow access only if the user has the required permissions
    return permissions.some((permission) =>
      user?.permissions.includes(permission),
    );
  }
}
