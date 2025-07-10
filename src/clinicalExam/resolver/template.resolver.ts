import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { TemplateService } from '../service/template.service';
import {
  CreateTemplateCategoryRes,
  CreateTemplateRes,
  GetShortCasesRecordRes,
  GetShortCasesTemplateRes,
  GetTemplateCategoryCasesRes,
} from '../types/clinicalExams.types';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import {
  AddShortCaseTemplateInput,
  AddTemplateCaseInput,
  CreateTemplateCategoryInput,
} from '../dto/template.dto';
import { TemplateEntity } from '../entity/template.entity';
import { TemplateCaseType } from '../enum/clinicalExam.enum';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class TemplateResolver {
  constructor(private readonly templateService: TemplateService) {}

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => CreateTemplateRes)
  async createTemplate(
    @Args('name') name: string,
    @Args({ name: 'isFree', type: () => Boolean, nullable: true })
    isFree: boolean,
  ): Promise<CreateTemplateRes> {
    return await this.templateService.createTemplate(name, isFree);
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => [CreateTemplateCategoryRes])
  async addTemplateCategory(
    @Args({
      name: 'createTemplateCategoryInput',
      type: () => [CreateTemplateCategoryInput],
    })
    createTemplateCategoryInput: CreateTemplateCategoryInput[],
    @Args('category') category: string,
    @Args({ name: 'isFree', type: () => Boolean, nullable: true })
    isFree: boolean,
  ) {
    return this.templateService.addTemplateCategory(
      createTemplateCategoryInput,
      category,
      isFree,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => TemplateEntity)
  async addLongTemplateCase(
    @Args('addTemplateCaseInput') addTemplateCaseInput: AddTemplateCaseInput,
    @Args('files', { type: () => [GraphQLUpload] }) files: FileUpload[],
    @Args({ name: 'isFree', type: () => Boolean, nullable: true })
    isFree: boolean,
  ) {
    return this.templateService.addLongTemplateCase(
      addTemplateCaseInput,
      files,
      isFree,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => TemplateEntity)
  async addLongTemplateCaseTest(
    @Args('addTemplateCaseInput') addTemplateCaseInput: AddTemplateCaseInput,
    @Args('files', { type: () => [GraphQLUpload] }) files: FileUpload[],
  ) {
    return this.templateService.addLongTemplateCaseTest(
      addTemplateCaseInput,
      files,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => TemplateEntity)
  async addShortTemplateCase(
    @Args('addTemplateCaseInput')
    addTemplateCaseInput: AddShortCaseTemplateInput,
    @Args('files', { type: () => [GraphQLUpload] }) files: FileUpload[],
    @Args({ name: 'isFree', type: () => Boolean, nullable: true })
    isFree: boolean,
  ) {
    return this.templateService.addShortTemplateCase(
      addTemplateCaseInput,
      files,
      isFree,
    );
  }

  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => String)
  async convertToHTML(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
  ) {
    return this.templateService.convertToHtml(file);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => TemplateEntity)
  async getTemplates(
    @Args('category') category: string,
    @Args('templateType') templateType: TemplateCaseType,
    @Args({ name: 'templateName', type: () => String, nullable: true })
    templateName: string,
    @Args({ name: 'isFree', type: () => Boolean, nullable: true })
    isFree: boolean,
  ) {
    return this.templateService.getTemplates(
      category,
      templateType,
      templateName,
      isFree,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [GetTemplateCategoryCasesRes])
  async getLongCasesTemplate(
    @Args('category') category: string,
    @Args('templateName') templateName: string,
    @Args({ name: 'page', type: () => Number, nullable: true }) page: number,
    @Args({ name: 'limit', type: () => Number, nullable: true }) limit: number,
    @Args({ name: 'isFree', type: () => Boolean, nullable: true })
    isFree: boolean,
  ) {
    return this.templateService.getLongCasesTemplate(
      category,
      templateName,
      isFree,
      page,
      limit,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [GetShortCasesTemplateRes])
  async getShortCasesTemplate(
    @Args('category') category: string,
    @Args('templateName') templateName: string,
    @Args({ name: 'page', type: () => Number, nullable: true }) page: number,
    @Args({ name: 'limit', type: () => Number, nullable: true }) limit: number,
    @Args({ name: 'isFree', type: () => Boolean, nullable: true })
    isFree: boolean,
  ) {
    return this.templateService.getShortCasesTemplate(
      category,
      templateName,
      isFree,
      page,
      limit,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [GetShortCasesRecordRes])
  async getShortCasesTemplateRecords(
    @Args('category') category: string,
    @Args('templateName') templateName: string,
    @Args('title') title: string,
    @Args({ name: 'page', type: () => Number, nullable: true }) page: number,
    @Args({ name: 'limit', type: () => Number, nullable: true }) limit: number,
    @Args({ name: 'isFree', type: () => Boolean, nullable: true })
    isFree: boolean,
  ) {
    return this.templateService.getShortCasesTemplateRecords(
      category,
      templateName,
      isFree,
      title,
      page,
      limit,
    );
  }
}
