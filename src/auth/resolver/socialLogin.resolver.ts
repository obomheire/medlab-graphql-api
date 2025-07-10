import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SocialLoginService } from '../service/socialLogin.service';
import { SocialLoginInput, GoogleLoginInput } from '../dto/socialLogin.input';
import { LoginRes } from '../types/auth.types';

@Resolver()
export class SocialLoginResolver {
  constructor(private readonly socialLoginService: SocialLoginService) {}

  // Google login
  @Mutation(() => LoginRes)
  async googleLoginMobile(
    @Args('googleLoginInput') googleLoginInput: GoogleLoginInput,
  ) {
    return this.socialLoginService.googleLoginMobile(googleLoginInput);
  }

  // Google login
  @Mutation(() => LoginRes)
  async appleLoginMobile(
    @Args('socialLoginInput') socialLoginInput: SocialLoginInput,
  ) {
    const isFacebook = false;
    const isApple = true;
    return this.socialLoginService.socialLogin(
      socialLoginInput,
      isApple,
      isFacebook,
    );
  }

  @Mutation(() => LoginRes)
  async facebookLoginMobile(
    @Args('socialLoginInput') socialLoginInput: SocialLoginInput,
  ) {
    const isFacebook = true;
    const isApple = false;
    return this.socialLoginService.socialLogin(
      socialLoginInput,
      isApple,
      isFacebook,
    );
  }

  // Google login slide
  @Mutation(() => LoginRes)
  async googleLoginSlide(@Args('token') token: string) {
    return this.socialLoginService.googleLoginSlide(token);
  }
}
