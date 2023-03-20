import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { AuthService } from './service/auth.service';
import { TokenService } from './service/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthResolver } from './resolver/auth.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [
        UserModule,
        MailModule,
        JwtModule.register({
          secret: process.env.TOKEN_SECRET,
            signOptions: { expiresIn:
                process.env.JWT_LIFESPAN,
            },
        }),
        TypeOrmModule.forFeature([User]),
      ],
    providers: [TokenService, AuthResolver, AuthService, JwtStrategy, GqlAuthGuard],
    exports: [TokenService],
})
export class AuthModule {}
