import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { MessageRes } from 'src/auth/types/auth.types';
import { ResetPasswordInput } from '../dto/user.input';
import { UserDocument, UserEntity } from '../entity/user.entity';
import { ProfileService } from '../service/profile.service';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UseGuards } from '@nestjs/common';
import { EditProfileInput, TogglePermission } from '../dto/profile.input';
import { ImageUrlRes } from '../types/user.types';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { PermissionsType } from '../enum/user.enum';
import { PermissionsGuard } from '../guard/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Resolver()
export class ProfileResolver {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

  // Upload profile image
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => ImageUrlRes)
  async uploadProfileImage(
    @GetUser() user: UserDocument,
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
  ) {
    return await this.profileService.uploadProfileImage(user, file);
  }

  // Get user's profile
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => UserEntity)
  async getProfile(@GetUser() user: UserDocument) {
    return user;
  }

  // Update user's profile
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  async updateProfile(
    @GetUser() user: UserDocument,
    @Args('editProfileInput') editProfileInput: EditProfileInput,
  ) {
    return await this.profileService.updateProfile(user, editProfileInput);
  }

  // Toggle permissions
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.ADMIN)
  @Mutation(() => MessageRes)
  async togglePermission(
    @Args('togglePermission') togglePermission: TogglePermission,
  ) {
    return await this.profileService.togglePermission(togglePermission);
  }
}
