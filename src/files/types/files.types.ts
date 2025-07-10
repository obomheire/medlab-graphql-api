import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FilesUploadRes {
  @Field(() => [String], { nullable: true })
  filesUrl: string[];
}
