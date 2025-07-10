import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { AccessModeType } from '../enum/presentation.enum';
import { PaginationArgs } from 'src/quiz/dto/question.input';
import { Pagination } from 'src/quiz/types/quiz.types';
import { PresentationEntity } from '../entity/presentation.entity';

@ArgsType()
export class FilterGetPresArgs extends PaginationArgs {
  @Field(() => String, { nullable: true })
  @IsEnum(AccessModeType)
  @IsOptional()
  accessMode: AccessModeType;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isDraft: boolean;
}

@ObjectType()
export class GetPresRes {
  @Field(() => [PresentationEntity])
  presentations: PresentationEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}


@ObjectType()
export class PresImageRes {
  @Field(() => String)
  prompt: string;

  @Field(() => Number, { nullable: true })
  slideNo: number;

  @Field(() => Number, { nullable: true })
  themeNo: number;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isTheme: boolean;

  @Field(() => String, { nullable: true })
  image: string;
}