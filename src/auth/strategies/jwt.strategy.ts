import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../service/auth.service'
import { TokenDto } from '../dto/token.dto'
import { AccountStatusEnum } from 'src/user/enum/accountStatus.enum'
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly service: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.TOKEN_SECRET,
    })
  }

  async validate(payload: TokenDto) {
    const user = await this.service.validateUser(payload.userId)

    if (!user || user.accountStatus === AccountStatusEnum.SUSPENDED) {
      throw new UnauthorizedException()
    }

    if (user.accountStatus === AccountStatusEnum.INACTIVE) {
      throw new UnauthorizedException('Account is not active')
    }

    return user
  }
}