import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleLoginInput, SocialLoginInput } from '../dto/socialLogin.input';
import { UserService } from 'src/user/service/user.service';
import { UserDocument, UserEntity } from 'src/user/entity/user.entity';
import { AuthService } from './auth.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { dynamicTemplates } from 'src/mail/email.constant';
import { AppType } from 'src/stripe/enum/sub.plan.enum';

@Injectable()
export class SocialLoginService {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private jwtService: JwtService,
  ) {}

  // Google login
  async googleLoginMobile(googleLoginInput: GoogleLoginInput) {
    try {
      const { email, firstName, app } = googleLoginInput;

      const isUserExist = await this.userModel.findOne({
        email: email.toLowerCase(),
      });

      if (!isUserExist) {
        const user = await this.userService.createUser({
          ...googleLoginInput,
          firstName: firstName || email.split('@')[0],
        });

        if (app === AppType.MEDSCROLL_CLINICAL_EXAMS) {
          // Send a welcome email to registered user
          await this.mailService.sendMail(email, {
            firstName,
            templateId: dynamicTemplates.clinExRegWelcomeMailTemplate,
          });

          user.app = AppType.MEDSCROLL_CLINICAL_EXAMS;
        }

        if (app === AppType.MEDSCROLL_SLIDE) {
          user.app = AppType.MEDSCROLL_SLIDE;
        }

        await user.save();

        return await this.loginUser(user);
      }

      return await this.loginUser(isUserExist);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async socialLogin(
    socialLoginInput: SocialLoginInput,
    isApple: boolean,
    isFacebook: boolean,
  ) {
    try {
      const { id, email, firstName, app } = socialLoginInput;

      const isSocialExist = await this.userModel.findOne({
        [isFacebook ? 'facebookId' : 'appleId']: id,
      });

      if (!isSocialExist) {
        if (email) {
          const isUserExist = await this.userModel.findOne({
            email: email.toLowerCase(),
          });

          if (!isUserExist) {
            if (!firstName)
              throw new BadRequestException(
                'First name is required on first login',
              );

            const createdUser = await this.userService.createUser(
              socialLoginInput,
              '',
              isApple,
              isFacebook,
            );

            if (app === AppType.MEDSCROLL_CLINICAL_EXAMS) {
              // Send a welcome email to registered user
              await this.mailService.sendMail(email, {
                firstName,
                templateId: dynamicTemplates.clinExRegWelcomeMailTemplate,
              });

              createdUser.app = AppType.MEDSCROLL_CLINICAL_EXAMS;
            }

            if (app === AppType.MEDSCROLL_SLIDE) {
              createdUser.app = AppType.MEDSCROLL_SLIDE;
            }

            await createdUser.save();

            return await this.loginUser(createdUser);
          }

          // If isFacebook is true, check & update facebookId otherwise check & update appleId
          if (!isUserExist[isFacebook ? 'facebookId' : 'appleId']) {
            isUserExist[isFacebook ? 'facebookId' : 'appleId'] = id;
            await isUserExist.save();
          }

          return await this.loginUser(isUserExist);
        }

        const createdUser = await this.userService.createUser(
          socialLoginInput,
          '',
          isApple,
          isFacebook,
        );

        if (app === AppType.MEDSCROLL_CLINICAL_EXAMS) {
          // Send a welcome email to registered user
          await this.mailService.sendMail(email, {
            firstName,
            templateId: dynamicTemplates.clinExRegWelcomeMailTemplate,
          });

          createdUser.app = AppType.MEDSCROLL_CLINICAL_EXAMS;
        }

        if (app === AppType.MEDSCROLL_SLIDE) {
          createdUser.app = AppType.MEDSCROLL_SLIDE;
        }

        await createdUser.save();

        return await this.loginUser(createdUser);
      }

      return await this.loginUser(isSocialExist);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Google login
  async googleLoginSlide(token: string) {
    try {
      const decodedToken = this.jwtService.decode(token) as {
        [key: string]: any;
      };

      if (!decodedToken) {
        throw new BadRequestException('Invalid token');
      }

      const email = decodedToken?.email || '';

      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const firstName = decodedToken?.given_name || '';

      const lastName = decodedToken?.family_name || '';

      const isUserExist = await this.userModel.findOne({
        email: email.toLowerCase(),
      });

      if (!isUserExist) {
        const user = await this.userService.createUser({
          email,
          firstName: firstName || email.split('@')[0],
          lastName,
        });

        user.app = AppType.MEDSCROLL_SLIDE;
        await user.save();

        return await this.loginUser(user);
      }

      return await this.loginUser(isUserExist);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // login user method
  async loginUser(isUserExist: UserDocument) {
    try {
      const { userUUID, isVerified, firstName } = isUserExist;
      // check if email is not already verified
      if (!isVerified) isUserExist.isVerified = true;

      // Check if isDeactivated if true
      if (isUserExist?.accountStatus?.isDisabled) {
        isUserExist.accountStatus.isDisabled = false;
        isUserExist.accountStatus.dateDisabled = null;
      }

      // Mark accountStatus field as modified
      isUserExist.markModified('accountStatus');
      await isUserExist.save();

      const tokens = await this.authService.getTokens(userUUID);

      return {
        user: isUserExist,
        access_token: tokens.accessToken,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
