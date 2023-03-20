import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
  } from '@nestjs/common';
  
  import { TokenDto } from '../dto/token.dto';
  import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
  
  @Injectable()
  export class TokenService {
    constructor() {}
    
    tokenize({
      data,
      expiresIn = process.env.JWT_LIFESPAN,
    }: {
      data: TokenDto;
      expiresIn?: string;
    }): Promise<string> {
      return new Promise((resolve, reject) => {
        const tokenSecret = process.env.TOKEN_SECRET;
        jwt.sign(data, tokenSecret, { expiresIn }, (err, decoded) => {
          if (err) reject(new InternalServerErrorException(err));
          resolve(decoded);
        });
      });
    }
  
    verify(token: string): Promise<any> {
      return new Promise((resolve, reject) => {
        const tokenSecret = process.env.TOKEN_SECRET;
        jwt.verify(token, tokenSecret, (err: any, decoded: any) => {
          if (err) {
            if (err.name === 'TokenExpiredError') {
              throw new UnauthorizedException('Token has expired');
            }
            reject(new UnauthorizedException(err));
          }
          resolve(decoded);
        });
      });
    }
  
    decode(token: string) {
      return jwt.decode(token, { complete: true });
    }

    async generateTokens(info: TokenDto) {
        const { role, userId, email, unique, accountStatus } = info;
        // generate jwt
        const authorizationToken = await this.tokenize({
          data: {
            role,
            userId,
            email,
            unique,
            accountStatus,
          },
          expiresIn: process.env.JWT_LIFESPAN,
        });
        return { authorizationToken };
      }
      catch(err) {
        Logger.error(err);
        throw new BadRequestException(err.message);
      }
  }
  
  