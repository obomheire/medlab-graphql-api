import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserEntity } from 'src/user/entity/user.entity';

@Injectable()
export class ClinExCreditGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;

    try {
      const {
        clinExSub: { subCredits = 0, topUpCredits = 0 },
      }: UserEntity = user;

      const totalCredits = subCredits + topUpCredits;

      // Check if redit does not exceed the limit
      if (totalCredits <= 0) {
        throw new BadRequestException(
          'INSUFFICIENT_CREDIT', // Access denied
        );
      }

      return true; // Access allowed
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
