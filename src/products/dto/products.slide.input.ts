import { Field, Float, InputType, PartialType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CostInput } from './products.input';
import { SlidePlanType } from '../enum/product.enum';

@InputType()
export class CreateSlideProductInput {
  @Field(() => String)
  @IsEnum(SlidePlanType)
  @IsNotEmpty()
  name: SlidePlanType;

  @Field(() => CostInput)
  @IsObject()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CostInput)
  price: CostInput;

  @Field(() => Boolean)
  accessToTemplateDesigns: boolean;

  @Field(() => Boolean)
  aiAssistanceWithSlideCreation: boolean;

  @Field(() => Boolean)
  slideSharing: boolean;

  @Field(() => Number)
  aiCredits: number;
}

@InputType()
export class UpdateSlideProductInput extends PartialType(
  CreateSlideProductInput,
) {
  @Field(() => String)
  slideProductUUID: string;
}
