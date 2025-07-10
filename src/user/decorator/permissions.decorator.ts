import { SetMetadata } from '@nestjs/common';
import { PermissionsType } from '../enum/user.enum';

export const Permissions = (...permissions: PermissionsType[]) =>
  SetMetadata('permissions', permissions);
