import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueError,
  OnQueueProgress,
  Process,
  Processor,
} from '@nestjs/bull';
import { CaseService } from './case.service';
import {
  QUESTION_CASE_JOB,
  QUESTION_QUEUE,
} from 'src/utilities/constant/queue.constant';
import { Job } from 'bull';
import { InsertQuestion } from 'src/utilities/interface/interface';
import { Logger } from '@nestjs/common';

@Processor(QUESTION_QUEUE)
export class CaseQuestionConsumer {
  private readonly logger = new Logger(CaseQuestionConsumer.name);
  constructor(private readonly caseService: CaseService) {}

  @Process(QUESTION_CASE_JOB)
  async processCaseQuestions(job: Job<InsertQuestion[]>) {
    return await this.caseService.processQuestions(job.data);
  }

  // @OnQueueActive()
  // onActive(job: Job) {
  //   console.log(
  //     `Active job ${job.id} of type ${job.name} with data ${job.data}...`,
  //   );
  // }

  @OnQueueProgress()
  onProgress(job: Job) {
    // this.logger
    // .debug
    //   `Processing job ${job.id} of type ${job.name}`,
    //   job.attemptsMade,
    //   job.isDelayed(),
    // ();
  }

  @OnQueueError()
  onError(job: Job) {
    // this.logger.debug(
    //   `Error job ${job.id} of type ${job.name} with data ${job.data}...`,
    // );
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    // this.logger.debug(
    //   `Completed job ${job.id} of type ${job.name} with data ${job.data}...`,
    // );
  }
}
