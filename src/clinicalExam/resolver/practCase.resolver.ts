import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { PaginationArgs } from 'src/quiz/dto/question.input';
import { PractCaseRes } from '../types/clinicalExams.types';
import { MessageRes } from 'src/auth/types/auth.types';
import { PractCaseService } from '../service/practCase.serveice';
import { UpdatePractCaseInput } from '../dto/practiceCase.dto';
import { PractCaseEntity } from '../entity/practCase.entity';

@UseGuards(AccessTokenAuthGuard, PermissionsGuard)
@Resolver()
export class PractCaseResolver {
  constructor(private readonly practCaseService: PractCaseService) {}

  // Create Practice case
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => PractCaseEntity)
  async createPractCase() {
    return await this.practCaseService.createPractCase();
  }

  // Update clinical exam
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => PractCaseEntity)
  async updatePractCase(
    @Args('updatePractCaseInput')
    updatePractCaseInput: UpdatePractCaseInput,
  ) {
    return await this.practCaseService.updatePractCase(updatePractCaseInput);
  }

  // Get all clinical exams
  @Query(() => PractCaseRes)
  async getPractCases(@Args() { page, limit }: PaginationArgs) {
    return await this.practCaseService.getPractCases(page, limit);
  }

  // Get clinical exam
  @Query(() => PractCaseEntity)
  async getPractCase(@Args('practCaseUUID') practCaseUUID: string) {
    return await this.practCaseService.getPractCase(practCaseUUID);
  }

  // Delete clinical exam
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => MessageRes)
  async deletePractCase(@Args('practCaseUUID') practCaseUUID: string) {
    return await this.practCaseService.deletePractCase(practCaseUUID);
  }
}
