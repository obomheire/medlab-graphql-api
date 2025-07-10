import { Injectable } from '@nestjs/common';
import { UserQuizScoreEntity } from '../entity/userQuizScoreEntity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserOpenEndedScoreInput,
  UserScoreInput,
} from '../dto/userScore.input';
import { UserScoreType } from '../enum/quiz.enum';
import { QuizAIService } from 'src/llm-providers/openAI/service/ai.quiz.service';
import { UserDocument } from 'src/user/entity/user.entity';
import { ThreadMessageInput } from 'src/llm-providers/openAI/dto/assistant.input';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';

//this service is used to save the user's score for the quiz
@Injectable()
export class SaveUserQuizScoreService {
  constructor(
    @InjectModel(UserQuizScoreEntity.name)
    private readonly userQuizScoreEntity: Model<UserQuizScoreEntity>,
    private readonly quizAIService: QuizAIService,
    private readonly asstThreadService: AsstThreadService,
  ) {}

  //save the user score for the multiple choice quiz
  async saveUserScoreMCQ(
    userScoreMCQ: UserScoreInput,
    user: UserDocument,
  ): Promise<string> {
    const { optionSelected, point, speed, answer, questionUUID } = userScoreMCQ;

    const userScore = {
      ...userScoreMCQ,
      optionSelected,
      userId: user._id,
      isCorrect: optionSelected === answer ? true : false,
      score: Number(optionSelected === answer ? point : 0),
      speed: speed || 0,
      speedBonus: optionSelected === answer ? (speed <= 8 ? 2 : 0) : 0,
      type: UserScoreType.MULTIPLE_CHOICE,
    };

    // Check if the score for this userId and questionUUID already exists
    const existingScore = await this.userQuizScoreEntity.findOne({
      userId: user._id,
      questionUUID: questionUUID,
    });

    if (existingScore) {
      await this.userQuizScoreEntity.updateOne(
        { userId: user._id, questionUUID: questionUUID },
        { $set: userScore },
      );
      return 'Score updated successfully';
    } else {
      await this.userQuizScoreEntity.create(userScore);
      return 'Score saved successfully';
    }
  }

  //save the user score for the open ended quiz
  async saveUserScoreOpenEnded(
    userScoreOpenEnded: UserOpenEndedScoreInput,
    user: UserDocument,
  ): Promise<string> {
    const { optionSelected, questionUUID, ...rest } = userScoreOpenEnded;

    const noCredit = this.quizAIService.checkUserCredit(user);

    const threadMessageInput: ThreadMessageInput = {
      threadId: '',
      message: '',
    };

    let newPayload: any = {
      ...rest,
      userId: user._id,
      type: UserScoreType.OPEN_ENDED,
      openEndedSelected: optionSelected,
    };

    // Check if the score for this userId and questionUUID already exists
    const existingScore = await this.userQuizScoreEntity.findOne({
      userId: user._id,
      questionUUID: questionUUID,
    });

    if (existingScore) {
      // Update the existing record if it exists
      if (noCredit || optionSelected?.length === 0 || !optionSelected) {
        newPayload.score = 0;
        newPayload.feedback =
          optionSelected?.length === 0 || !optionSelected
            ? 'You scored 0 because your answer was empty. Please provide your answers for evaluation.'
            : 'You scored 0 because you have no credit. Please purchase more credit to continue.';
        newPayload.speedBonus = 0;
      } else {
        // Generate the prompt for the AI to grade the user answer
        threadMessageInput.message = this.dxPrompt({
          userAnswer: optionSelected,
          expectedAnswerDetails: userScoreOpenEnded.answer_details,
        });

        const { message: content } = await this.asstThreadService.addMessage(
          user,
          threadMessageInput,
          ComponentType.DX_QUEST,
          null,
          null,
          null,
        );
        const parsedContent = JSON.parse(content);

        if (parsedContent) {
          let checkPass = 0;
          parsedContent?.['score_per_item'].forEach((result) => {
            if (result === 1) {
              checkPass += 1;
            }
          });

          let newScore =
            parsedContent?.['score_per_item']?.length === checkPass
              ? rest.point
              : Math.round(rest.point / 2);
          newPayload.isCorrect = checkPass > 0 ? true : false;
          newPayload.speedBonus =
            checkPass > 0 ? (rest.speed <= 30 ? 2 : 0) : 0;
          newPayload.feedback = parsedContent?.['feedback'];
          newPayload.score = newScore;
        }
      }

      // Update the existing score record
      await this.userQuizScoreEntity.updateOne(
        { userId: user._id, questionUUID: questionUUID },
        { $set: newPayload },
      );
      return 'Score updated successfully';
    } else {
      // If no record exists, create a new score
      if (noCredit || optionSelected?.length === 0 || !optionSelected) {
        newPayload.score = 0;
        newPayload.feedback =
          optionSelected?.length === 0 || !optionSelected
            ? 'You scored 0 because your answer was empty. Please provide your answers for evaluation.'
            : 'You scored 0 because you have no credit. Please purchase more credit to continue.';
        newPayload.speedBonus = 0;
      } else {
        // Generate the prompt for the AI to grade the user answer
        threadMessageInput.message = this.dxPrompt({
          userAnswer: optionSelected,
          expectedAnswerDetails: userScoreOpenEnded.answer_details,
        });

        const { message: content } = await this.asstThreadService.addMessage(
          user,
          threadMessageInput,
          ComponentType.DX_QUEST,
          null,
          null,
          null,
        );
        const parsedContent = JSON.parse(content);

        if (parsedContent) {
          let checkPass = 0;
          parsedContent?.['score_per_item'].forEach((result) => {
            if (result === 1) {
              checkPass += 1;
            }
          });

          let newScore =
            parsedContent?.['score_per_item']?.length === checkPass
              ? rest.point
              : Math.round(rest.point / 2);
          newPayload.isCorrect = checkPass > 0 ? true : false;
          newPayload.speedBonus =
            checkPass > 0 ? (rest.speed <= 30 ? 2 : 0) : 0;
          newPayload.feedback = parsedContent?.['feedback'];
          newPayload.score = newScore;
        }
      }

      // Create the new score record
      await this.userQuizScoreEntity.create(newPayload);
      return 'Score saved successfully';
    }
  }

  //get the user score by type
  async getUserScoreByType(
    user: UserDocument,
    type: UserScoreType,
    category?: string,
    subcategory?: string,
    sectionTitle?: string,
  ): Promise<UserQuizScoreEntity[]> {
    let matchQuery: any = {};
    matchQuery.userId = user._id;
    if (category) matchQuery.category = category;
    if (subcategory) matchQuery.subcategory = subcategory;
    if (sectionTitle) matchQuery.sectionTitle = sectionTitle;
    matchQuery.type = type;
    const userScore = await this.userQuizScoreEntity.find(matchQuery);
    return userScore;
  }

  //get the user scores
  async getUserScores(
    user: UserDocument,
    category?: string,
    subcategory?: string,
    sectionTitle?: string,
  ): Promise<UserQuizScoreEntity[]> {
    let matchQuery: any = {};
    matchQuery.userId = user._id;
    if (category) matchQuery.category = category;
    if (subcategory) matchQuery.subcategory = subcategory;
    if (sectionTitle) matchQuery.sectionTitle = sectionTitle;
    const userScore = await this.userQuizScoreEntity.find(matchQuery);
    return userScore;
  }

  dxPrompt(responses: any) {
    return `
    Strictly follow the instructions below to grade the user's answers based on the provided answer details. For each user answer, compare it with the corresponding correct information in the "answer_details" field. Award a score of 1 for each correct answer. If the answer is wrong, irrelevant, incomplete, or too short, assign a score of 0.

    1. Compare the user's answers in the "${JSON.stringify(
      responses?.userAnswer,
    )}" array with the correct information in the "${JSON.stringify(
      responses?.expectedAnswerDetails,
    )}".
    2. Check for **correctness, relevance, completeness, and meaning** in each answer. If an answer is lacking in any of these aspects, score it 0. 
    3. Strictly handle **short responses or incomplete answers**: If a user submits an answer shorter than 3 characters (such as a single letter or number), automatically score it 0, regardless of context.
    4. Strictly handle **duplicates**: If an answer is duplicated, even if correct, **award a score of 1 only for the first occurrence**. All other duplicate occurrences should receive a score of 0.
    5. Handle **irrelevant parts**: Even if an answer contains a correct concept, but is surrounded by irrelevant or meaningless text, score it 0. For example:

    **Answer Details**:
        1. Ischemic Heart Disease: Most likely cause of LBBB, particularly in the presence of syncope.
        2. Dilated Cardiomyopathy: Can cause LBBB due to left ventricular dilation and dysfunction.
        3. Aortic Stenosis: Can cause LBBB due to pressure overload and left ventricular hypertrophy.

    **User Answer**:
        ["Aortic Stenosis", "Dilated Cardiomyopathy is also a factor and can not tell me anything", "Aortic Stenosis"]

    In this case, the user should only get a score of 1 for the first "Aortic Stenosis" and 0 for other answers due to irrelevance and duplication.

    6. Strictly ensure that if the user enters a single character, such as "A" or "B", you don't assume it to mean the correct options in the answer details. Assign a score of 0 for such incomplete responses.
    7. Ensure you check for **meaningful and complete** user answers. If an answer contains correct information but is **too short or incomplete**, score it 0.
    8. Ensure that the score for each user's answer is recorded in an array called "score_per_item", where each entry corresponds to the score for the respective answer in the user's "${JSON.stringify(
      responses?.userAnswer,
    )}" array. For example, if the user's answers are ["answer1", "answer2", "answer3", "answer4"], and only "answer3" and "answer4" are correct, the array should be [0, 0, 1, 1].
    9. Strictly ensure you don't assume a provided answer by the user that is just a single character to stand for anything on the "answerDetails". when a user provid just a single character, give a score of zero regardless whether you consider it to be an acronym.
    10. Use your medical knowledge to evaluate the correctness of answers beyond what is in "answer_details", but give detailed feedback explaining why the answer is correct or incorrect.
    11. Strictly ensure your response does not include unnecessary characters such as 'json' in the response or returned result.
    12. If you are unable to evaluate a user's answer, return the following JSON response:
    {
      "description": "A brief description of the prompt",
      "score_per_item": [0, 0, 0, 0],
      "feedback": "Evaluate the user’s response in light of your knowledge of the general literature. Highlight why their response is correct or wrong and provide detailed explanations of the subtopics being tested. Offer additional correct answers for their learning."
    }
    13. Personalize the feedback section to the user. For example, use words like "Your" instead of "the user".
    14. Add a paragraph in the feedback section that outlines other possible answers for the given question and provides reasons behind the listed answers.
    15. Strictly return the output in the following JSON format without code block formatting or unnecessary characters:
    {
      "description": "A brief description of the prompt",
      "score_per_item": [0, 1, 0, 0],
      "feedback": "Evaluate the user’s response in light of your knowledge of the general literature. Highlight why their response is correct or wrong and provide detailed explanations of the subtopics being tested. Offer additional correct answers for their learning."
    }

    Provided Data:
    {
      "Answer details": ${JSON.stringify(responses?.expectedAnswerDetails)},
      "User answer": ${JSON.stringify(responses?.userAnswer)}
    }

    Please ensure the grading is strict, considering synonyms, relevance, correctness, completeness, and duplicates. If the user submits incomplete answers or just single characters, they should automatically receive a score of 0.
    `;
  }
}
