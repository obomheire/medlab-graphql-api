import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthLoginInput } from '../dto/login.dto';
import { TokenDto } from '../dto/token.dto';
import { LoginResponse } from '../dto/login-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { TokenResponse } from '../dto/token-response.dto';
import { UserService } from 'src/user/service/user.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { sendForgotEmail } from 'src/templates/forgot-password.template';
import { ResetPasswordInput } from '../dto/reset-password.dto';
import { ChangePasswordInput } from '../dto/change-password.dto';
import { AccountStatusEnum } from 'src/user/enum/accountStatus.enum';
import { FirstLoginInput } from '../dto/first-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  private signToken(user: TokenDto): string {
    return this.jwt.sign(user);
  }

  public async validateUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    return user;
  }

  async getTokens(user: TokenDto): Promise<TokenResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(user, {
        secret: process.env.TOKEN_SECRET,
        expiresIn: process.env.JWT_LIFESPAN,
      }),
      this.jwt.signAsync(user, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_SECRET_EXPIRY,
      }),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async decodeToken(token: string) {
    const decoded = await this.jwt.verifyAsync(token, {
      secret: process.env.TOKEN_SECRET,
    });
    return decoded;
  }

  async decodeRefreshToken(token: string) {
    const decoded = await this.jwt.verifyAsync(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
    return decoded;
  }

  async login(input: AuthLoginInput): Promise<LoginResponse> {
    const { email, unique, password } = input;
    if (!email && !unique) {
      throw new BadRequestException('Email or UniqueID is required');
    }
    const user = await this.userService.findByEmailOrUnique(email, unique);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordValid = await user.validatePassword(password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }
    if (user.accountStatus !== AccountStatusEnum.ACTIVE) {
      throw new BadRequestException('Account is not active');
    }
    const tokens = await this.getTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      unique: user.unique,
      accountStatus: user.accountStatus,
    });
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    // if(user.accountStatus === AccountStatusEnum.INACTIVE){
    //   user.accountStatus = AccountStatusEnum.ACTIVE
    //   await this.userRepository.save(user)
    // }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(id: string, token: string): Promise<TokenResponse> {
    try {
      const data = await this.userService.findById(id);
      if (!data || !data.refreshToken)
        throw new ForbiddenException('Access Denied');
      const refreshTokenMatches = await bcrypt.compare(
        data.refreshToken,
        token,
      );
      if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');
      const decoded = await this.decodeRefreshToken(token);
      const user = await this.validateUser(decoded.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const tokens = await this.getTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        unique: user.unique,
        accountStatus: user.accountStatus,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new ForbiddenException('Access Denied');
    }
  }

  private async updateRefreshToken(
    userId: string,
    token: string,
  ): Promise<void> {
    //hash the refresh token
    const hashedToken = await bcrypt.hash(token, 10);

    await this.userService.updateRefreshToken(userId, hashedToken);
  }

  async logout(userId: string, refreshToken = null): Promise<string> {
    try {
      await this.userService.updateRefreshToken(userId, refreshToken);
      return 'logout successful';
    } catch (error) {
      throw new ForbiddenException('Access Denied');
    }
  }

  async forgotPassword(email: string): Promise<string> {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const token = await this.jwt.signAsync(
        {
          userId: user.id,
        },
        {
          secret: process.env.TOKEN_SECRET,
          expiresIn: process.env.JWT_LIFESPAN,
        },
      );
      //send email
      const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      const htmlTemplate = sendForgotEmail(user.firstName, link);
      const message = `Hi ${user.firstName}, <br><br> Please click on the link to reset your password: <a href="${link}">${link}</a>`;
      await this.mailService.sendMail(
        message,
        htmlTemplate,
        email,
        'Reset Password',
      );
      return token;
    } catch (error) {
      throw new ForbiddenException('Access Denied');
    }
  }

  async resetPassword(resetPassword: ResetPasswordInput): Promise<string> {
    try {
      const { token, password } = resetPassword;
      const decoded = await this.jwt.verifyAsync(token, {
        secret: process.env.TOKEN_SECRET,
      });
      const user = await this.userService.findById(decoded.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.userService.updatePassword(user.id, hashedPassword);
      return 'Password reset successful';
    } catch (error) {
      throw new ForbiddenException('Access Denied');
    }
  }

  //user change password
  async changePassword(
    userId: string,
    changePassword: ChangePasswordInput,
  ): Promise<string> {
    try {
      const { oldPassword, newPassword } = changePassword;
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const isPasswordValid = await user.validatePassword(oldPassword);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userService.updatePassword(user.id, hashedPassword);
      return 'Password change successful';
    } catch (error) {
      throw new ForbiddenException('Access Denied');
    }
  }

  //change password at first login. the login is with email and password. then prompt to change password. then update account status from inactive to active
  async changePasswordAtFirstLogin(data: FirstLoginInput): Promise<string> {
    try {
      const { email, password, newPassword, confirmPassword } = data;
      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const isPasswordValid = await user.validatePassword(password);
      console.log(isPasswordValid);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('Password mismatch');
      }
      const newUser = await this.userService.updatePassword(
        user.id,
        newPassword,
      );
      newUser.accountStatus = AccountStatusEnum.ACTIVE;
      await this.userRepository.save(newUser);
      return 'Password change successful, you cqan now login';
    } catch (error) {
      throw error;
    }
  }
}
