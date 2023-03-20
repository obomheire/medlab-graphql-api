import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { Role } from 'src/role/entities/role.entity';

@ObjectType()
// @InputType()
export class TokenDto {
  @Field()
  @IsString()
  accountStatus: string;

  @Field()
  @IsString()
  unique: string;

  @Field()
  @IsString()
  userId: string;

  @Field(() => Role, { description: 'role field (placeholder)' })
  // @IsString()
  role: Role;

  @Field()
  @IsString()
  email: string;
}
