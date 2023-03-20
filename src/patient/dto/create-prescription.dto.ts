import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DrugFrequencyEnum } from '../enum/drug-frequency.enum';
import { FoodRelationEnum } from '../enum/food-relation.enum';
import { RouteOfAdminEnum } from '../enum/route-admin.enum';

@InputType()
export class PrescriptionUnit {
  @Field(() => String, {
    description: 'product field (placeholder)',
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  product: string;

  @Field(() => String, {
    description: 'strength field (placeholder)',
    nullable: false,
  })
  @IsString()
  @IsOptional()
  notes: string;

  @Field(() => String, {
    description: 'unit field (placeholder)',
    nullable: false,
  })
  @IsEnum(DrugFrequencyEnum)
  @IsOptional()
  frequency: DrugFrequencyEnum;

  @Field(() => String, {
    description: 'route of admin (placeholder)',
    nullable: false,
  })
  @IsOptional()
  @IsEnum(RouteOfAdminEnum)
  routeOfAdmin: RouteOfAdminEnum;

  @Field(() => Int, {
    description: 'duration field (placeholder)',
    nullable: false,
  })
  @IsNumber()
  @IsOptional()
  duration: number;

  @Field(() => Int, {
    description: 'quantity field (placeholder)',
    nullable: false,
  })
  @IsNumber()
  @IsOptional()
  quantity: Number;

  @Field(() => String, {
    description: 'strength field (placeholder)',
    nullable: false,
  })
  @IsEnum(FoodRelationEnum)
  @IsOptional()
  foodRelation: FoodRelationEnum;
}

@InputType()
export class CreatePrescriptionInput {
  @Field(() => PrescriptionUnit, {
    description: 'account status field (placeholder)',
    nullable: true,
  })
  @Type(() => PrescriptionUnit)
  @ValidateNested()
  @IsOptional()
  items: PrescriptionUnit;

  @Field(() => String)
  @IsString()
  patient: string

  @Field(() => String)
  @IsString()
  visit: string;

  @Field(() => String)
  @IsString()
  doctor: string;
}
