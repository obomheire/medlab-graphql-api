import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserEntity } from 'src/user/entity/user.entity';

@Injectable()
export class CreditControlGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;

    try {
      const {
        subscription: { subCredits, topUpCredits },
      }: UserEntity = user;

      const totalCredits = subCredits + (topUpCredits || 0);

      // Check if redit does not exceed the limit
      if (totalCredits <= 0) {
        if (user?.hasSubscribed) {
          throw new BadRequestException(
            'INSUFFICIENT_CREDIT', // Access denied
          );
        } else {
          throw new BadRequestException(
            'INTRO_INSUFFICIENT_CREDIT', // Access denied
          );
        }
      }

      return true; // Access allowed
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
