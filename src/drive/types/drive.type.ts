import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { PaginationArgs } from 'src/quiz/dto/question.input';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import { Pagination } from 'src/quiz/types/quiz.types';
import { Drive } from '../entity/types.entity';

@ArgsType()
export class DriveArgs extends PaginationArgs {
  @Field(() => String, {
    nullable: true,
  })
  @IsString()
  @IsOptional()
  dateCreated: string;

  @Field(() => String, {
    nullable: true,
  })
  @IsEnum(ComponentType)
  @IsOptional()
  component: ComponentType;
}

@ArgsType()
export class SearchDriveArgs extends PaginationArgs {
  @Field(() => String, {
    nullable: true,
  })
  @IsString()
  @IsOptional()
  search: string;
}

@ObjectType()
export class DriveData {
  @Field(() => String)
  driveUUID: string;

  @Field(() => String)
  component: string;

  @Field(() => Drive)
  content: Drive;
}

@ObjectType()
export class DriveTitleCat {
  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => [DriveData])
  data: DriveData[];
}

@ObjectType()
export class DriveTitleCatRes {
  @Field(() => [DriveTitleCat])
  drive: DriveTitleCat[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class DriveDemo {
  @Field(() => String, { nullable: true })
  driveUUID: string;

  @Field(() => String, { nullable: true })
  dateCreated: string;

  @Field(() => String, { nullable: true })
  component: string;

  @Field(() => Drive)
  content: Drive;
}

@ObjectType()
export class AllDriveARes {
  @Field(() => [DriveDemo])
  drive: DriveDemo[];

  @Field(() => Pagination)
  pagination: Pagination;
}
