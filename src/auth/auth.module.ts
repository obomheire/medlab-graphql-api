import { Module, UseGuards } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthResolver } from './resolver/auth.resolver';
import { AccessTokenStrategy } from './strategy/accessToken.strategy';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokenStrategy } from './strategy/refreshToken.strategy';
import { MailModule } from 'src/mail/mail.module';
import { CryptoService } from './service/crypto.service';
import { SocialLoginResolver } from './resolver/socialLogin.resolver';
import { SocialLoginService } from './service/socialLogin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from 'src/user/entity/user.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: UserEntity.name,
        useFactory: () => {
          return UserSchema;
        },
      },
    ]),
    JwtModule.register({}),
    MailModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    SocialLoginResolver,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    CryptoService,
    SocialLoginService,
  ],
  exports: [AuthService, CryptoService],
})
export class AuthModule {}
