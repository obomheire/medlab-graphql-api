import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ClinicalExamService } from '../service/clinicalExam.service';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { ClinicalExamEntity } from '../entity/clinicalExams.entity';
import { UpdateClinicalExamInput } from '../dto/clinicalExam.dto';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { PaginationArgs } from 'src/quiz/dto/question.input';
import { GetClinicalExamsRes } from '../types/clinicalExams.types';
import { MessageRes } from 'src/auth/types/auth.types';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Resolver()
export class ClinicalExamResolver {
  constructor(private readonly clinicalExamService: ClinicalExamService) {}

  // Create Clinical Exam
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ClinicalExamEntity)
  async createClinicalExam() {
    return await this.clinicalExamService.createClinicalExam();
  }

  // Update clinical exam
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => ClinicalExamEntity)
  async updateClinicalExam(
    @Args('updateClinicalExamInput')
    updateClinicalExamInput: UpdateClinicalExamInput,
  ) {
    return await this.clinicalExamService.updateClinicalExam(
      updateClinicalExamInput,
    );
  }

  // Get all clinical exams
  @Query(() => GetClinicalExamsRes)
  async getClinicalExams(@Args() { page, limit }: PaginationArgs) {
    return await this.clinicalExamService.getClinicalExams(page, limit);
  }

  // Get clinical exam
  @Query(() => ClinicalExamEntity)
  async getClinicalExam(@Args('examUUID') examUUID: string) {
    return await this.clinicalExamService.getClinicalExam(examUUID);
  }

  // Delete clinical exam
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => MessageRes)
  async deleteClinicalExam(@Args('examUUID') examUUID: string) {
    return await this.clinicalExamService.deleteClinicalExam(examUUID);
  }
}
