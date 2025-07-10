import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CaseService } from 'src/quiz/service/case.service';
import { PositionService } from 'src/user/service/position.service';

@Injectable()
export class InsertPositionService {
  private readonly logger = new Logger(InsertPositionService.name);

  constructor(
    private readonly positionService: PositionService,
    private readonly caseService: CaseService,
  ) {
    this.logger.log('InsertPositionService instantiated');
  }

  // @Cron('34 17  * * *') // run the cron 2: 42 pm
  async insertRoles() {
    try {
      const roles = await this.positionService.insertRoles();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // @Cron('39 17  * * *') // run the cron 2: 42 pm
  async insertSpecialties() {
    try {
      const specialties = await this.positionService.insertSpecialties();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // @Cron('* *  * * *') // run the cron 2: 42 pm
  async processQuestions() {
    try {
      const questions = [];

      // await this.caseService.processQuestions(questions);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
