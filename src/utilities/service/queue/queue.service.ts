import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateOpenEndedQuesInput } from 'src/quiz/dto/question.input';

@Injectable()
export class QuizQueueService {
  constructor(@InjectQueue('quiz') private readonly quizQueue: Queue) {}

  // Add a job to the queue
  async addDxQuestToQueue(payload: CreateOpenEndedQuesInput) {
    await this.quizQueue.add('open-ended', payload);
    return 'Your process is being queued';
  }
}
