import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { UpdateFaqInput } from '../dto/clinicalExam.dto';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { PaginationArgs } from 'src/quiz/dto/question.input';
import { FaqEntity } from '../entity/faq.entity';
import { FaqService } from '../service/faq.service';
import { MessageRes } from 'src/auth/types/auth.types';
import { GetFaqsRes } from '../types/clinicalExams.types';

@Resolver()
export class FaqResolver {
  constructor(private readonly faqService: FaqService) {}

  // Create faq
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => [FaqEntity])
  async createFaq() {
    return await this.faqService.createFaq();
  }

  // Update faq
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => FaqEntity)
  async updateFaq(@Args('updateFaqInput') updateFaqInput: UpdateFaqInput) {
    return await this.faqService.updateFaq(updateFaqInput);
  }

  // Get all faqs
  @Query(() => GetFaqsRes)
  async getFaqs(@Args() { page, limit }: PaginationArgs) {
    return await this.faqService.getFaqs(page, limit);
  }

  // Get faq
  @Query(() => FaqEntity)
  async getFaq(@Args('faqUUID') faqUUID: string) {
    return await this.faqService.getFaq(faqUUID);
  }

  // Delete faq
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => MessageRes)
  async deleteFaq(@Args('faqUUID') faqUUID: string) {
    return await this.faqService.deleteFaq(faqUUID);
  }
}
