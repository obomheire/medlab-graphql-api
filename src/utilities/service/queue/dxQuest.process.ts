import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { CreateOpenEndedQuesInput } from 'src/quiz/dto/question.input';
import { QuizService } from 'src/quiz/service/quiz.service';

@Processor('quiz')
export class QuizProcessor {
  constructor(private readonly quizService: QuizService) {}

  // Process the queue job
  @Process('create-open-ended-quiz')
  async handleCreateQuiz(job: Job<CreateOpenEndedQuesInput>) {
    // This will run in the background
    await this.quizService.generateOpenEndedAIAdminQuiz(job.data);
  }
}
