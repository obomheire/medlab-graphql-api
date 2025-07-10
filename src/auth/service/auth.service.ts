import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/service/user.service';
import { ValidateOtpInput, LoginInput, SignUpInput } from '../dto/auth.input';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefrestTokenRes, LoginRes, MessageRes } from '../types/auth.types';
import { MailService } from 'src/mail/mail.service';
import { UserDocument } from 'src/user/entity/user.entity';
import { WsException } from '@nestjs/websockets';
import { dynamicTemplates } from 'src/mail/email.constant';
import { AppType } from 'src/stripe/enum/sub.plan.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Create new user
  async registerUser(signUpInput: SignUpInput): Promise<MessageRes> {
    try {
      const { password, firstName, lastName, email, app } = signUpInput;

      // Check if firstName or lastName is medscroll
      if (
        firstName?.toLowerCase().replace(/\s/g, '') === 'medscroll' ||
        lastName?.toLowerCase().replace(/\s/g, '') === 'medscroll'
      )
        throw new ForbiddenException(
          'Sorry, you cannot create an account with this name!',
        );

      // Hash the password and confirm password
      const hashedPassword = await this.hashData(password);

      // Create the user acount
      const user = await this.userService.createUser(
        { ...signUpInput, firstName: firstName || email.split('@')[0] },
        hashedPassword,
      );

      if (app === AppType.MEDSCROLL_CLINICAL_EXAMS) {
        // Send a welcome email to registered user
        await this.mailService.sendMail(email || user.email, {
          firstName: user.firstName,
          templateId: dynamicTemplates.clinExRegWelcomeMailTemplate,
        });

        user.app = AppType.MEDSCROLL_CLINICAL_EXAMS;
      }

      if (app === AppType.MEDSCROLL_SLIDE) {
        user.app = AppType.MEDSCROLL_SLIDE;
      }

      await user.save();

      // Send OTP
      return await this.sendOtp(user, dynamicTemplates.otpRegTemplate);
    } catch (error) {
      if (error.message.includes('E11000')) {
        throw new BadRequestException('User with the email already exist');
      }
      throw new BadRequestException(error.message);
    }
  }

  // Continue as guest
  async continueAsGuest(): Promise<LoginRes> {
    try {
      // Create quest user acount
      const guest = await this.userService.continueAsGuest();

      const tokens = await this.getTokens(guest.userUUID);

      return {
        user: guest,
        access_token: tokens.accessToken,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Login user with email and password.
  async loginUser({ email, password }: LoginInput): Promise<LoginRes> {
    try {
      const user = await this.userService.getUserByEmail(email);

      const { userUUID, firstName, isVerified, password: _password } = user;

      const isPasswordValid = await this.verifyHashData(_password, password);

      if (!isPasswordValid)
        throw new UnauthorizedException('Invalid credentials!');

      // Send OTP if user account is not verified
      if (!isVerified)
        return await this.sendOtp(user, dynamicTemplates.otpRegTemplate);

      const tokens = await this.getTokens(userUUID);

      await this.updateRefreshToken(userUUID, tokens.refreshToken);

      // Check if isDeactivated if true
      if (user?.accountStatus?.isDisabled) {
        user.accountStatus.isDisabled = false;
        user.accountStatus.dateDisabled = null;

        // Mark accountStatus field as modified
        user.markModified('accountStatus');
        await user.save();
      }

      return {
        user,
        access_token: tokens.accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException)
        throw new UnauthorizedException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  // Login user with OTP.
  async loginUserOtp(email: string): Promise<MessageRes> {
    try {
      const user = await this.userService.getUserByEmail(email);

      // Check if isDeactivated if true
      if (user?.accountStatus?.isDisabled) {
        user.accountStatus.isDisabled = false;
        user.accountStatus.dateDisabled = null;

        // Mark accountStatus field as modified
        user.markModified('accountStatus');
        await user.save();
      }

      return await this.sendOtp(user, dynamicTemplates.otpLoginTemplate);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Valdate login user OTP.
  async validateLoginUserOtp({
    email,
    otp,
  }: ValidateOtpInput): Promise<LoginRes> {
    try {
      const user = await this.userService.getUserByEmail(email);

      const { userUUID, firstName, isVerified } = user;

      const isOtpValid = await this.validateOtp(otp, user);

      if (!isOtpValid) throw new ForbiddenException('Invalid OTP!');

      const tokens = await this.getTokens(userUUID);

      await this.updateRefreshToken(userUUID, tokens.refreshToken);

      if (!isVerified) {
        user.isVerified = true;

        await user.save();
      }

      return {
        user,
        access_token: tokens.accessToken,
      };
    } catch (error) {
      if (error instanceof ForbiddenException)
        throw new ForbiddenException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  // Get a new access token with refresh token
  async refreshTokens(
    userUUID: string,
    refreshToken: string,
  ): Promise<RefrestTokenRes> {
    try {
      const user = await this.userService.getUserByUUID(userUUID);
      const { firstName, refreshToken: _refreshToken } = user;

      if (!user || !refreshToken) throw new ForbiddenException('Access Denied');

      const refreshTokenMatches = await this.verifyHashData(
        _refreshToken,
        refreshToken,
      );

      if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

      const tokens = await this.getTokens(userUUID);

      await this.updateRefreshToken(userUUID, tokens.refreshToken);

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof ForbiddenException)
        throw new ForbiddenException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  //send otp to user's email
  async sendOtp(
    user: UserDocument,
    templateId: string,
    email?: string,
  ): Promise<{ message: string }> {
    try {
      //generate 6 digit random number and send it to user email as otp
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await this.mailService.sendMail(email || user.email, {
        firstName: user.firstName,
        otp,
        templateId,
      });

      // otpExpiry is set to 1 hour from the time the otp is generated
      const otpExpiry = new Date(); // Current date

      otpExpiry.setHours(otpExpiry.getHours() + 1); // Add one hour to current date

      const hashedOtp = await this.hashData(otp); // Hash the otp

      user.otp = hashedOtp;
      user.otpExpiry = otpExpiry;

      await user.save();

      return {
        message:
          'Verification is required, please check your email for instruction to continue',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Validate OTP from user
  async validateOtp(otp: string, user: UserDocument): Promise<boolean> {
    try {
      if (!user.otp) throw new ForbiddenException('Invalid OTP');

      //compare the otp which is hashed saved in the db
      const isOtpValid = await this.verifyHashData(user.otp, otp);

      if (!isOtpValid) throw new ForbiddenException('Invalid OTP');

      //check if otp is still valid
      const otpExpiry = new Date(user.otpExpiry);

      const now = new Date();

      if (now > otpExpiry) {
        throw new ForbiddenException('OTP has expired');
      }

      user.otp = null;
      await user.save();

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException)
        throw new ForbiddenException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  // Get tokens
  async getTokens(userUUID: string) {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(
          {
            sub: userUUID,
          },
          {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            // expiresIn: '1d',
          },
        ),
        this.jwtService.signAsync(
          {
            sub: userUUID,
          },
          {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
          },
        ),
      ]);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Decode jws token
  async verifyToken(token: string) {
    try {
      const tokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

      const { sub: userUUID } = this.jwtService.verify(token, {
        secret: tokenSecret,
      });

      const user = await this.userService.getUserByUUID(userUUID);

      return {
        userUUID,
        userId: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        url: user?.profileImage,
        plan: user?.subscription?.plan,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  // Hash passsword
  async hashData(password: string): Promise<string> {
    try {
      return await argon.hash(password);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Verify password with hashed data
  async verifyHashData(
    userPassword: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await argon.verify(userPassword, password);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update user's refresh token
  async updateRefreshToken(userUUID: string, refreshToken: string) {
    try {
      const hashedRefreshToken = await this.hashData(refreshToken);

      await this.userService.updateAccessToken(userUUID, hashedRefreshToken);
    } catch (error) {
      throw new WsException(error.message);
    }
  }
}
