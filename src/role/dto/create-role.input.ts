import { InputType, Int, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateRoleInput {
  @Field(() => String, { description: 'name field (placeholder)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => String, { description: 'description field (placeholder)', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}
