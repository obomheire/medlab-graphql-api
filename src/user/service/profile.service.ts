import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDocument, UserEntity } from '../entity/user.entity';
import { EditProfileInput, TogglePermission } from '../dto/profile.input';
import { AuthService } from 'src/auth/service/auth.service';
import { MessageRes } from 'src/auth/types/auth.types';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { ImageUrlRes } from '../types/user.types';
import { ConfigService } from '@nestjs/config';
import { dynamicTemplates } from 'src/mail/email.constant';

@Injectable()
export class ProfileService {
  constructor(
    private readonly userService: UserService,
    private readonly awsS3Service: AwsS3Service,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  // Upload profile image
  async uploadProfileImage(
    user: UserDocument,
    file: FileUpload,
  ): Promise<ImageUrlRes> {
    try {
      // Delete profile image if already exist
      if (user?.profileImage)
        await this.awsS3Service.deleteFiles([user.profileImage]);

      // Save image to S3
      const { createReadStream } = await file;
      const stream = createReadStream();
      const { secure_url } = await this.awsS3Service.uploadImage(
        'profile-images',
        stream,
      );

      // Update user's profile image
      user.profileImage = secure_url;
      await user.save();

      return { secure_url };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  // Update user's profile
  async updateProfile(
    user: UserDocument,
    editProfileInput: EditProfileInput,
  ): Promise<MessageRes> {
    try {
      const {
        username,
        firstName,
        lastName,
        email,
        country,
        countryCode,
        state_city,
        role,
        specialty,
        subspecialty,
      } = editProfileInput;

      // Check if firstName or lastName is equal to medscroll, if yes throw error.
      if (
        firstName?.toLowerCase().replace(/\s/g, '') === 'medscroll' ||
        lastName?.toLowerCase().replace(/\s/g, '') === 'medscroll'
      )
        throw new ForbiddenException(
          'Sorry, you cannot update your account with this name!',
        );

      user.firstName = firstName;
      user.lastName = lastName || '';
      user.username = username;
      user.country = {
        country: country || user?.country?.country,
        code: countryCode || user?.country?.code,
      };
      user.state_city = state_city || user?.state_city;
      user.specialty = specialty || user?.specialty;
      user.role = role || user?.role;
      user.specialty = specialty || user?.specialty;
      user.subspecialty = subspecialty || user?.subspecialty;

      if (email && user?.email !== email?.toLowerCase()) {
        user.email = email?.toLowerCase();
        user.isVerified = false;

        // Mark country field as modified
        user.markModified('country');
        await user.save();

        // Send OTP for email verification
        return await this.authService.sendOtp(
          user,
          dynamicTemplates.otpLoginTemplate,
          email,
        );
      }

      // Mark country field as modified
      user.markModified('country');
      await user.save();

      return {
        message: 'Profile updated successfully',
      };
    } catch (error) {
      if (error.message.includes('E11000')) {
        throw new BadRequestException('username/email already exist');
      }
      throw new BadRequestException(error.message);
    }
  }

  // Toggle permissions
  async togglePermission({
    email,
    permissions,
  }: TogglePermission): Promise<MessageRes> {
    try {
      const user = await this.userService.getUserByEmail(email);

      user.permissions = permissions;
      await user.save();

      return {
        message: 'Permission updated successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
