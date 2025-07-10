import { Args, Context, Mutation, Resolver, Query } from '@nestjs/graphql';
import { AuthService } from '../service/auth.service';
import {
  ValidateOtpInput,
  LoginInput,
  SignUpInput,
  GetOtpInput,
} from '../dto/auth.input';
import { LoginRes, MessageRes, RefrestTokenRes } from '../types/auth.types';
import { UseGuards } from '@nestjs/common';
import { RefreshTokenAuthGuard } from '../guard/refreshToken.guard';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // Create new user
  @Mutation(() => MessageRes)
  async registerUser(@Args('signUpInput') signUpInput: SignUpInput) {
    return await this.authService.registerUser(signUpInput);
  }

  // Continue as guest
  @Mutation(() => LoginRes)
  async continueAsGuest() {
    return await this.authService.continueAsGuest();
  }

  // Login user with emqail and pasword.
  @Mutation(() => LoginRes)
  async loginUser(@Args('loginInput') loginInput: LoginInput) {
    return await this.authService.loginUser(loginInput);
  }

  // Login user with emqail and pasword
  @Mutation(() => MessageRes)
  async loginUserOtp(@Args('getOtpInput') getOtpInput: GetOtpInput) {
    return await this.authService.loginUserOtp(getOtpInput.email);
  }

  // Login user with OTP.
  @Mutation(() => LoginRes)
  async validateLoginUserOtp(
    @Args('validateOtpInput') validateOtpInput: ValidateOtpInput,
  ) {
    return await this.authService.validateLoginUserOtp(validateOtpInput);
  }

  // // Get a new access token with refresh token
  // @UseGuards(RefreshTokenAuthGuard)
  // @Query(() => RefrestTokenRes)
  // async refreshTokens(@Context() context: any) {
  //   const { sub: userUUID, refreshToken } = context?.req?.user;

  //   return this.authService.refreshTokens(userUUID, refreshToken);
  // }
}
