import { Module, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { CtxUser } from '../decorators/ctx-user.decorator';
import { ChangePasswordInput } from '../dto/change-password.dto';
import { FirstLoginInput } from '../dto/first-login.dto';
import { LoginResponse } from '../dto/login-response.dto';
import { AuthLoginInput } from '../dto/login.dto';
import { ResetPasswordInput } from '../dto/reset-password.dto';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { AuthService } from '../service/auth.service';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => LoginResponse)
  async login(@Args('input') input: AuthLoginInput): Promise<LoginResponse> {
    return await this.authService.login(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String)
  async logout(@CtxUser() user: User): Promise<string> {
    return await this.authService.logout(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String)
  async changePassword(
    @CtxUser() user: User,
    @Args('input') input: ChangePasswordInput,
  ): Promise<string> {
    return await this.authService.changePassword(user.id, input);
  }

  @Mutation(() => String)
  async forgotPassword(@Args('email') email: string): Promise<string> {
    return await this.authService.forgotPassword(email);
  }

  @Mutation(() => String)
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<string> {
    return await this.authService.resetPassword(input);
  }

  @Mutation(() => String)
  async changePasswordAtFirstLogin(
    @Args('input') input: FirstLoginInput,
  ): Promise<string> {
    return await this.authService.changePasswordAtFirstLogin(input);
  }
}
