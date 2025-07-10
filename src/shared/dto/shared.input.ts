import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SharedContentType } from '../enum/shared.enum';

@InputType()
export class SharedInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  contentUUID: string;

  @Field({ description: 'Alowed: SLIDE_PRESENTATION' })
  @IsNotEmpty()
  @IsEnum(SharedContentType)
  sharedContent: SharedContentType;
}
