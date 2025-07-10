import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { CalculateRankingRes, MessageRes } from 'src/auth/types/auth.types';
import { GetOtpInput } from 'src/auth/dto/auth.input';
import {
  ContactUsInput,
  CreditUserInput,
  ResetPasswordInput,
} from '../dto/user.input';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { PermissionsGuard } from '../guard/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';
import { PermissionsType } from '../enum/user.enum';
import { UserDocument, UserEntity } from '../entity/user.entity';
import { DataRes } from 'src/stripe/types/stripe.types';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // Find if user name exist
  @Query(() => MessageRes)
  async findUsername(@Args('username') username: string) {
    return await this.userService.findUsername(username);
  }

  // Forgot password, send OTP
  @Mutation(() => MessageRes)
  async forgotPassword(@Args('getOtpInput') getOtpInput: GetOtpInput) {
    return await this.userService.forgotPassword(getOtpInput);
  }

  // Reset password
  @Mutation(() => MessageRes)
  async resetPassword(
    @Args('resetPasswordInput') resetPasswordInput: ResetPasswordInput,
  ) {
    return await this.userService.resetPassword(resetPasswordInput);
  }

  // Reset password
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => MessageRes)
  async deactivateAccount(@GetUser() user: UserDocument) {
    return await this.userService.deactivateAccount(user);
  }

  // Contact us
  @Mutation(() => MessageRes)
  async contactUs(@Args('contactUsInput') contactUsInput: ContactUsInput) {
    return await this.userService.contactUs(contactUsInput);
  }

  // Testing update daily and weekly streaks
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => MessageRes)
  async tesingStreaks(@GetUser() user: UserDocument) {
    return await this.userService.tesingStreaks(user);
  }

  // Calculate ranking
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Query(() => CalculateRankingRes)
  async calculateRanking(@Args('userUUID') userUUID: string) {
    return await this.userService.calculateRanking(userUUID);
  }

  // Credit user token for testing
  @Mutation(() => DataRes)
  async demoCreditUser(
    @Args('creditUserInput') { email, amount, app }: CreditUserInput,
  ) {
    return await this.userService.demoCreditUser(email, amount, app);
  }

  // Get UUID
  @Mutation(() => DataRes)
  getUUID() {
    return this.userService.getUUID();
  }

  // Test event generation
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  async demoTriggerEvent(
    @GetUser() user: UserDocument,
    @Args('event') event: ComponentType,
  ) {
    return await this.userService.demoTriggerEvent(user, event);
  }
}
