import {
    BadRequestException,
    Injectable,
    NestMiddleware,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  
  import { Request, Response, NextFunction } from 'express';
  import { TokenService } from 'src/auth/service/token.service';
  import { TokenDto } from 'src/auth/dto/token.dto';
  import { AccountStatusEnum } from 'src/user/enum/accountStatus.enum';
  
  
  @Injectable()
  export class TokenMiddleware implements NestMiddleware {
    constructor(
      private readonly tokenService: TokenService,
      // @InjectModel(UserEntity.name)
      // private UserModel: Model<UserDocument>,
    ) {}
    async use(req: any, res: Response, next: () => void) {
        
      if (!req.headers.authorization) {
        throw new UnauthorizedException(
          'you must be logged in to access this route',
        );
      }
      const authorizationHeader = req.headers.authorization;
      const [bearer, token] = authorizationHeader.split(' ');
      if (bearer !== 'Bearer') {
        throw new NotFoundException('please provide a Bearer token');
      }
  
      if (!token) {
        throw new Notification('token not found');
      }
      const tokenData: TokenDto = await this.tokenService.verify(token);
  
      if (tokenData.accountStatus === AccountStatusEnum.SUSPENDED) {
        throw new BadRequestException(
          'your account is suspended, kindly reach out to your administrator for instructions on reactivating your account',
        );
      }
      if (tokenData.accountStatus === AccountStatusEnum.INACTIVE) {
        throw new BadRequestException(
          'you need to log in and reset your password',
        );
      }
      const userID = tokenData.userId;
      req.user = userID

      next();
    }
  }
  