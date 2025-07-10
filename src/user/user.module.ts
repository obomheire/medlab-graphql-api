import { Global, Module, forwardRef } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserResolver } from './resolver/user.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from './entity/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { AuthModule } from 'src/auth/auth.module';
import { ProfileService } from './service/profile.service';
import { ProfileResolver } from './resolver/profile.resolver';
import { RoleEntity, RoleSchema } from './entity/role.entity';
import { PositionService } from './service/position.service';
import { PositionResolver } from './resolver/position.resolver';
import { SpecialtyEntity, SpecialtySchema } from './entity/specialty.entity';

@Global()
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
    MongooseModule.forFeatureAsync([
      {
        name: RoleEntity.name,
        useFactory: () => {
          return RoleSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: SpecialtyEntity.name,
        useFactory: () => {
          return SpecialtySchema;
        },
      },
    ]),
    MailModule,
    forwardRef(() => AuthModule),
  ],
  providers: [
    UserService,
    UserResolver,
    ProfileService,
    ProfileResolver,
    PositionResolver,
    PositionService,
  ],
  exports: [UserService, PositionService],
})
export class UserModule {}
