import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserEntity } from 'src/user/entity/user.entity';

@Injectable()
export class GuestGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;

    try {
      const { isGuest }: UserEntity = user;

      // Check if redit does not exceed the limit
      if (isGuest) {
        throw new BadRequestException(
          'Please sign up to unlock this and more exciting features!', // Access denied
        );
      }

      return true; // Access allowed
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
