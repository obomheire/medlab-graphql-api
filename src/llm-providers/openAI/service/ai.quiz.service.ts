import { BadRequestException, Injectable } from '@nestjs/common';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { ConfigService } from '@nestjs/config';
import { CasePromptInput, QuizPromptInput } from '../dto/quizAI.input';
import {
  CasePromptRes,
  OpenEndedAIRes,
  PromptRes,
  QuizAIRes,
} from '../types/ai.type';
import {
  ComponentType,
  FileExtType,
  QuestionType,
  UserThreadType,
} from '../enum/assistantAI.enum';
import shuffle from 'lodash.shuffle';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { extname } from 'path';
import OpenAI from 'openai';
import { ChatCompletion } from 'openai/resources';
import { ChatHistoryService } from './ai.quiz.history';
import { UserService } from 'src/user/service/user.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import ShortUniqueId from 'short-unique-id';
import { v4 as uuidv4 } from 'uuid';
import { AsstThreadService } from './ai.thread.service';
import { ObjectId } from 'mongodb';
import { UserDocument, UserEntity } from 'src/user/entity/user.entity';
import {
  OpenEndedResponseInput,
  SubmitOpenEndedResInput,
} from 'src/quiz/dto/question.input';
import { ThreadMessageInput } from '../dto/assistant.input';
import { OpenEndedQuizScoreRes } from 'src/quiz/types/quiz.types';
import { dxQuestPrompt } from '../constant/openEnded.constant';
import { isValidJSON } from 'src/utilities/service/helpers.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeaderBoardEventsType } from 'src/quiz/enum/quiz.enum';
import { EpisodeQuiz, EpisodeQuizRes } from 'src/utilities/interface/interface';

@Injectable()
export class QuizAIService {
  private readonly uid = new ShortUniqueId({ length: 16 });
  private readonly openai: OpenAI;
  private readonly maxToken: number;

  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private chatHistoryService: ChatHistoryService,
    private readonly httpService: HttpService,
    private readonly asstThreadService: AsstThreadService,
    private readonly emitter: EventEmitter2,
  ) {
    this.maxToken = 4096;
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  // Generate quiz for episode
  async generateEpisodeQuiz(
    user: UserDocument,
    episodeQuiz: EpisodeQuiz,
    file: FileUpload,
  ) {
    try {
      const { title, optionNo = 4, noOfQuestions, quizType } = episodeQuiz;

      const prompt = `Strictly follow the instructions below to generate questions: 
              I have uploaded a file. Extract the content of the file and use it to generate questions.
              
              1. Strictly ensure ${quizType} types of questions are generated
              2. Strictly ensure ${optionNo} unique options are generated per question
              3. Strictly ensure the questions are not more or less than ${noOfQuestions}
              4. Strictly ensure none of the previous or current questions are repeated
              5. Strictly ensure the answer exactly matches one of the options
              6. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position
              7. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question
              8. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
              {
                questions: [
                  {
                  question: string;
                  options: string[];
                  answer: string;
                  answer_details: string;
                  topic: ${title};
                  }
                ]
              }`;

      const response = await this.asstThreadService.addMessage(
        user,
        {
          threadId: null,
          message: prompt,
        },
        ComponentType.CHAT_SIMULATION,
        '',
        file ? [file] : [],
      );

      let quizzes: EpisodeQuizRes;

      if (!isValidJSON(response?.message)) {
        quizzes = await this.asstThreadService.getValidateJSON(
          response?.message,
        );
      } else {
        quizzes = JSON.parse(response?.message); // Deserialize the aiMessage
      }

      // Shuffle options array
      quizzes?.questions?.forEach((question) => {
        if (question?.options) {
          question.options = shuffle(question?.options);
        }
      });

      return { quizzes: quizzes?.questions, threadId: response?.threadId };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Generate poll for episode
  async generateEpisodePoll(
    user: UserDocument,
    episodeQuiz: EpisodeQuiz,
    file: FileUpload,
  ) {
    try {
      // const { title, optionNo = 4, noOfPolls, quizThreadId } = episodeQuiz;

      // const prompt = `Strictly follow the instructions below to generate polls:
      //         I have uploaded a file. Extract the content of the file and use it to generate poll questions.

      //         1. Strictly ensure that only opinion-based or preference-based poll questions are generated.
      //         2. Strictly ensure each question has exactly ${optionNo} unique, reasonable, and relevant options.
      //         3. Strictly ensure the number of poll questions is exactly ${noOfPolls}.
      //         4. Strictly ensure none of the previous or current questions are repeated.
      //         5. Strictly ensure that there is no concept of a "correct" answer — all options must be equally valid.
      //         6. Strictly ensure that the order of options is randomized for each question to avoid bias.
      //         7. Strictly ensure the output is strictly in JSON format as follows, without using code block formatting and without any additional comments before or after the JSON object:
      //         {
      //           polls: [
      //             {
      //               question: string;
      //               options: string[];
      //               topic: ${title}
      //             }
      //           ]
      //         }`;

      const { title, optionNo = 4, noOfPolls, quizThreadId } = episodeQuiz;

      const baseInstruction = quizThreadId
        ? 'Refer to the previously uploaded content associated with this conversation thread and generate poll questions based on that.'
        : 'I have uploaded a file. Extract the content of the file and use it to generate poll questions.';

      const prompt = `Strictly follow the instructions below to generate polls: 
      ${baseInstruction}

      1. Strictly ensure that only opinion-based or preference-based poll questions are generated.
      2. Strictly ensure each question has exactly ${optionNo} unique, reasonable, and relevant options.
      3. Strictly ensure the number of poll questions is exactly ${noOfPolls}.
      4. Strictly ensure none of the previous or current questions are repeated.
      5. Strictly ensure that there is no concept of a "correct" answer — all options must be equally valid.
      6. Strictly ensure the order of options is randomized for each question to avoid bias.
      7. Strictly ensure the output is strictly in JSON format as follows, without using code block formatting and without any additional comments before or after the JSON object:
      {
        polls: [
          {
            question: string;
            options: string[];
            topic: ${title}
          }
        ]
      }`;

      const response = await this.asstThreadService.addMessage(
        user,
        {
          threadId: quizThreadId || null,
          message: prompt,
        },
        ComponentType.CHAT_SIMULATION,
        '',
        file ? [file] : [],
      );

      let polls: EpisodeQuizRes;

      if (!isValidJSON(response?.message)) {
        polls = await this.asstThreadService.getValidateJSON(response?.message);
      } else {
        polls = JSON.parse(response?.message); // Deserialize the aiMessage
      }

      // Shuffle options array
      polls?.polls?.forEach((poll) => {
        if (poll?.options) {
          poll.options = shuffle(poll?.options);
        }
      });

      return { polls: polls?.polls, threadId: response?.threadId };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Generate questions for quiz with AI model
  async generateAIquiz(
    user: UserDocument,
    quizPromptInput: QuizPromptInput,
    file?: FileUpload,
  ): Promise<QuizAIRes> {
    try {
      let webContent = '';

      const {
        prompt,
        url,
        questionNo = quizPromptInput?.questionNo || 10,
        optionNo = quizPromptInput?.optionNo || 4,
        questionType = quizPromptInput?.questionType ||
          QuestionType.MULTIPLE_CHOICE,
        threadId,
        allowMultiAnswer,
        isPresentation,
      } = quizPromptInput;

      if (url) webContent = await this.scrapeWebPage(url);

      if (!file && !prompt && !url)
        throw new BadRequestException('Prompt cannot be empty.');

      // Ensure questionNo does not exceed 10
      const noOfQuestion = Math.min(questionNo, 10);

      // For a true or false question, set option to 2
      const noOfOptions =
        questionType === QuestionType.TRUE_OR_FALSE ? 2 : Math.min(optionNo, 4); // Set optionNo to a max of 4
      let command: string;

      if (
        questionType.toLowerCase() ===
        QuestionType.OPEN_ENDED_QUESTION.toLowerCase()
      ) {
        command = file
          ? ` Strictly follow the instructions below to generate questions: 
              I have uploaded a file. Extract the content of the file and process it using the prompt: ${prompt} to generate questions.`
          : ` Strictly follow the instructions below to generate questions: 
              Text to generate questions: ${prompt} ${webContent}`;

        command += `
              *"Generate open-ended medical questions that assess clinical reasoning and diagnostic skills. Each question should require a detailed response and focus on real-world patient scenarios. Ensure the questions is based on the presentation discussed. Avoid yes/no or multiple-choice formats.

              Structure each question as follows:

              Based on the Presentation, clearly describe a clinical scenario, including relevant patient demographics, symptoms, and medical history.
              Pose an open-ended question that requires critical thinking, such as diagnosis, differential diagnosis, treatment plan, or pathophysiological explanation.
              Example:
              A 55-year-old male with a history of hypertension and smoking presents with sudden-onset, severe chest pain radiating to his back. His blood pressure is significantly different in both arms.
              What is the most likely diagnosis, and what steps would you take to confirm it?

              2. Strictly ensure ${questionType} types of questions are generated
              3. Strictly ensure the questions are not more or less than ${noOfQuestion}
              4. Strictly ensure none of the previous or current questions are repeated
              5. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
              {
                "description": "A brief description of the prompt",
                questions: [
                  {
                  question: string;
                  answer: ["List at least 4 possible answers to the scenario"];
                  answer_details: "detailed explanations to the the answers given.";
                  subtopic: string;
                  }
                ]
              }`;
      } else {
        if (isPresentation) {
          if (allowMultiAnswer) {
            command = file
              ? ` Strictly follow the instructions below to generate questions: 
              I have uploaded a file. Extract the content of the file and process it using the prompt: ${prompt} to generate questions.`
              : ` Strictly follow the instructions below to generate questions: 
              Text to generate questions: ${prompt} ${webContent}`;

            command += `
              2. Strictly ensure ${questionType} types of questions are generated
              3. Strictly ensure ${noOfOptions} unique options are generated per question
              4. Strictly ensure the questions are not more or less than ${questionNo}
              5. Strictly ensure none of the previous or current questions are repeated
              6. Strictly ensure the index of the correct answers are shuffled in the options array for all questions, preventing the correct answers from consistently appearing in the same position
              7. Strictly ensure that there are multiple correct answers included within the options for any question.
              8. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
              {
                "description": "A brief description of the prompt",
                questions: [
                  {
                  question: string;
                  options: string[];
                  answer: string[];
                  answer_details: string;
                  subtopic: string;
                  }
                ]
              }`;
          } else {
            command = file
              ? ` Strictly follow the instructions below to generate questions: 
              I have uploaded a file. Extract the content of the file and process it using the prompt: ${prompt} to generate questions.`
              : ` Strictly follow the instructions below to generate questions: 
              Text to generate questions: ${prompt} ${webContent}`;

            command += `
              2. Strictly ensure ${questionType} types of questions are generated
              3. Strictly ensure ${noOfOptions} unique options are generated per question
              4. Strictly ensure the questions are not more or less than ${questionNo}
              5. Strictly ensure none of the previous or current questions are repeated
              6. Strictly ensure the answer exactly matches one of the options
              7. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position
              8. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question
              9. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
              {
                "description": "A brief description of the prompt",
              questions: [
                  {
                  question: string;
                  options: string[];
                  answer: string[];
                  answer_details: string;
                  subtopic: string;
                  }
                ]
              }`;
          }
        } else {
          command = file
            ? ` Strictly follow the instructions below to generate questions: 
              I have uploaded a file. Extract the content of the file and process it using the prompt: ${prompt} to generate questions.`
            : ` Strictly follow the instructions below to generate questions: 
              Text to generate questions: ${prompt} ${webContent}`;

          command += `
              2. Strictly ensure ${questionType} types of questions are generated
              3. Strictly ensure ${noOfOptions} unique options are generated per question
              4. Strictly ensure the questions are not more or less than ${noOfQuestion}
              5. Strictly ensure none of the previous or current questions are repeated
              6. Strictly ensure the answer exactly matches one of the options
              7. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position
              8. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question
              9. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
              {
                "description": "A brief description of the prompt",
                questions: [
                  {
                  question: string;
                  options: string[];
                  answer: string;
                  answer_details: string;
                  subtopic: string;
                  }
                ]
              }`;
        }
      }

      const response = await this.asstThreadService.addMessage(
        user,
        {
          threadId: threadId || null,
          message: command,
        },
        ComponentType.QUIZ_AI,
        prompt,
        file ? [file] : [],
        'instant-quiz-files',
      );

      // Chech if content is a valid json format
      if (!isValidJSON(response?.message))
        throw new BadRequestException(
          'Unable to generating response at this time. Please try again later.',
        );

      // Deserialize the aiMessage
      const quiz = JSON.parse(response?.message);

      // Shuffle options array
      quiz?.questions?.forEach((question) => {
        // quiz?.questions?.forEach((question: PromptRes) => {
        if (question?.options) {
          question.options = shuffle(question?.options);
        }
      });

      return { questions: quiz?.questions, threadId: response?.threadId };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async generateAIPoll(
    user: UserDocument,
    quizPromptInput: QuizPromptInput,
    file?: FileUpload,
  ): Promise<QuizAIRes> {
    try {
      const {
        prompt,
        threadId,
        questionNo = quizPromptInput?.questionNo || 1,
      } = quizPromptInput;
      const noOfOptions = quizPromptInput?.optionNo || 4;

      const command = `Based on the presentation content and the prompt ${prompt}, please create polls for the audience. Strictly follow the instructions below to generate polls:
        
        1. Provided prompt: "${prompt}";
        2. strictly ensure to generate ${noOfOptions} unique options for the poll.
        3. Strictly ensure the total number of generated poll(s) is not more or less than ${questionNo}
        4. Strictly ensure that if prompt: "${prompt}" is empty, generate poll based on the presentation content.

        example of a poll:
            "How confident are you in diagnosing and treating malaria effectively?"

            Options:
            A) Very confident – I can diagnose and treat malaria without hesitation.
            B) Somewhat confident – I know the basics but may need guidance.
            C) Not very confident – I have some knowledge but lack practical experience.
            D) Not confident at all – I would need significant support to manage a malaria case.
        5. Strictly enusre that there is no duplicate options.
        6. Strictly ensure the options does not include the characters "A)", "B)", "C)", "D)" etc. It should be only the options.
        7. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
              {
                "description": "A brief description of the prompt",
                questions: [
                  {
                  question: put the poll question here;
                  options: ["Option 1", "Option 2", "Option 3", "Option 4"];
                  answer: this filed can empty since it is a poll;
                  answer_details: this filed can empty since it is a poll;
                  subtopic: this filed can empty since it is a poll;
                  }
                ]
              }`;

      const response = await this.asstThreadService.addMessage(
        user,
        {
          threadId: threadId || null,
          message: command,
        },
        ComponentType.QUIZ_AI,
        prompt,
        file ? [file] : [],
        'instant-quiz-files',
      );

      // Chech if content is a valid json format
      if (!isValidJSON(response?.message))
        throw new BadRequestException(
          'Unable to generating response at this time. Please try again later.',
        );

      // Deserialize the aiMessage
      const quiz = JSON.parse(response?.message);

      // Shuffle options array
      quiz?.questions?.forEach((question) => {
        question.answer = [];
        if (question?.options) {
          question.options = shuffle(question?.options);
        }
      });

      return { questions: quiz?.questions, threadId: response?.threadId };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Generate case and questions with AI model
  async generateAIcase(
    user: UserDocument,
    { prompt, level }: CasePromptInput,
  ): Promise<CasePromptRes> {
    try {
      const threadId = await this.asstThreadService.getOrCreateThread(
        user,
        UserThreadType.CASE_RECALL,
      );

      const command = `
        1. I have provided a PDF file name: case_recall_all_levels_templates.pdf with headings for different case recall levels. Please use the content
        under the specified level as a template to generate a detailed medical case scenario or use this
        instruction to generate the case Instruction: ${prompt}. For example, if I provide "Level 7", use 
        the "Case Recall Level 7 Template" as a guide. The case scenario should be complex and realistic, 
        with increasing difficulty as the level increases. You may use the "Case Recall Level 3 Sample" as 
        an example of a simple case to build upon for higher levels. After creating the case scenario, 
        generate 10 multiple choice questions with 4 unique options each. The questions should test the 
        reader's understanding of the case and cover various aspects of the medical subject. 
        2. Ensure that the subject of the case scenario is varied and different from previous requests. 
        3. Avoid questions that test medical knowledge of the case, but rather focus on memory recall of the facts of the case as presented.
        4. Strictly ensure the answer exactly matches one of the options provided in the question.
        5. Use international units for values. You may put US units in bracket if different. For instance, 37oC (98oF)
        6. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
        {
        "description": "A brief description of the prompt",
        "caseDetails": "A well organized case detetails with clear paragraphs, headings, and proper punctuation using Markdown.",
        "keywords": "Comma-separated keywords related to the case and subject",
        "level": ${level},
        "subject": "Medical specialty or topic",
        "questions": [
          {
            "question": "Multiple choice question",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "answer": "Correct answer",
            "answer_details": "Explanation for the correct answer",
            "subtopic": "Specific topic tested by the question"
          }
        ]
        }
`;

      const response = await this.asstThreadService.addMessage(
        user,
        {
          threadId,
          message: command,
        },
        ComponentType.CASE_RECALL,
        prompt,
      );

      // Chech if content is a valid json format
      if (!isValidJSON(response?.message))
        throw new BadRequestException(
          'Unable to generating response at this time. Please try again later.',
        );

      // Deserialize the aiMessage
      const caseRecall = JSON.parse(response?.message);

      // Shuffle options array
      caseRecall?.questions?.forEach((question: PromptRes) => {
        question.options = shuffle(question.options);
      });

      const transformQuestion = this.transformQustions(caseRecall?.questions);

      return {
        ...caseRecall,
        questions: transformQuestion,
        threadId,
        totalQuestion: transformQuestion?.length,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Generate internal open ended questions
  async generateOpenEndedQuesAdmin(payload: any): Promise<OpenEndedAIRes> {
    try {
      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );

      const user = await this.userService.getUserByObjectId(medScrollId);

      const threadMessageInput: ThreadMessageInput = {
        threadId: '',
        message: dxQuestPrompt(payload),
      };

      const {
        message: content,
        threadId: chatThreadId,
        messageId,
      } = await this.asstThreadService.addMessage(
        user,
        threadMessageInput,
        ComponentType.DX_QUEST,
        null,
        null,
        null,
      );

      if (!isValidJSON(content)) {
        throw new BadRequestException(content);
      }

      const tempParsed = JSON.parse(content);
      const parsedContent = tempParsed?.data;

      return {
        user,
        questions: parsedContent,
      };
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  // Generate open ended questions for quiz with AI model
  async generateDxAIquiz(
    quizPromptInput: QuizPromptInput,
    user: UserDocument,
    file?: FileUpload,
  ): Promise<PromptRes[]> {
    try {
      let extractedText = '';
      let webContent = '';

      const {
        prompt,
        url,
        questionNo = 500,
        optionNo = 4,
        topic,
        subtopic,
        questionType = QuestionType.OPEN_ENDED_LONG_FORM,
      } = quizPromptInput;

      if (url) webContent = await this.scrapeWebPage(url);

      // if (!file && !prompt && !url)
      //   throw new BadRequestException('Prompt cannot be empty.');

      // If file exist extract the text from the file
      if (file) {
        const fileExtension = extname(file.filename).toLowerCase();
        extractedText = await this.extractText(file, fileExtension);
      }

      // Ensure questionNo does not exceed 10
      // const noOfQuestion = 500;
      const noOfQuestion = Math.min(questionNo, 500);

      // For a true or false question, set option to 2
      const noOfOptions =
        questionType === QuestionType.TRUE_OR_FALSE
          ? 2
          : questionType === QuestionType.OPEN_ENDED_SHORT_FORM
          ? 4
          : questionType === QuestionType.OPEN_ENDED_LONG_FORM
          ? 0
          : Math.min(optionNo, 4); // Set optionNo to a max of 4

      const otherQuestionscommand = `
  Strictly follow the instructions below to generate questions:

  1. Text to generate questions: ${prompt} ${extractedText} ${webContent}
  2. Strictly ensure ${questionType} types of questions are generated
  3. Strictly ensure ${noOfOptions} unique options are generated per question
  4. Strictly ensure the questions are not more or less than ${noOfQuestion}
  5. Strictly ensure none of the previous or current questions are repeated
  6. Strictly ensure the answer exactly matches one of the options
  7. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position
  8. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question
  9. Strictly return a valid json of the following format: 
  {
  "description": "A brief description of the prompt",
   questions: [
    {
    question: string;
    options: string[];
    answer: string;
    answer_details: string;
    subtopic: string;
    topic: string;
    }
   ]
  }
`;
      const openEndedLongFormcommand = `
  Strictly follow the instructions below to generate open ended long form questions:

  Step 1: If the provided prompt and other text in the triple quote is not empty """${prompt} ${extractedText} ${webContent}""" use it to generate the open ended long form questions for the following topic in tripple quote: """${topic}""" and subtopic, if not empty: """${subtopic}"""
  Step 2: If the provided prompt in Step 1 is empty, generate open ended long form questions for the following topic in tripple quote: """${topic}""" and subtopic, if not empty: """${subtopic}"""
  Step 3: Strictly ensure the following question type in tripple quote """${questionType}""" are generated
  Step 4: Strictly ensure the questions are not less than the provided number of questions in tripple quote """${noOfQuestion}""".
  Step 5: Strictly ensure none of the previous or current questions are repeated
  Step 6: Strictly return a valid json of the following format: 
  {
  "description": "A brief description of the prompt",
   questions: [
    {
    question: string;
    options: string[];
    answer: string;
    answer_details: string;
    subtopic: string;
    topic: string;
    }
   ]
  }
`;
      const openEndedShortFormcommand = `
  Strictly follow the instructions below to generate open ended short form questions:


  Step 1: If the provided prompt and other text in the triple quote is not empty """${prompt} ${extractedText} ${webContent}""" use it to generate the open ended short form questions for the following topic in tripple quote: """${topic}""" and subtopic, if not empty: """${subtopic}"""
  Step 2: If the provided prompt in Step 1 is empty, generate open ended short form questions for the following topic in tripple quote: """${topic}""" and subtopic, if not empty: """${subtopic}"""
  Step 3: Strictly ensure the following question type in tripple quote """${questionType}""" are generated
  Step 4: Strictly ensure ${noOfOptions} unique options are generated per question
  Step 5: Strictly ensure the questions are not less than the provided number of questions in tripple quote """${noOfQuestion}"""
  Step 6: Strictly ensure none of the previous or current questions are repeated
  Step 7: Strictly ensure the answer(s) exactly matches one or more on the options
  Step 8: Strictly ensure the index of the correct answer(s) is shuffled in the options array for all questions, preventing the correct answer(s) from consistently appearing in the same position
  Step 9: Strictly ensure that options can contain a multiple correct answers for a given question. which mean, you should also mix questions that will warrant the user to select all correct answers from a list of options.
  Step 10: Strictly return a valid json of the following format: 
  {
  "description": "A brief description of the prompt",
   questions: [
    {
    question: string;
    options: string[];
    answer: string;
    answer_details: string;
    subtopic: string;
    topic: string;
    }
   ]
  }
`;

      const command =
        questionType === QuestionType.OPEN_ENDED_LONG_FORM
          ? openEndedLongFormcommand
          : questionType === QuestionType.OPEN_ENDED_SHORT_FORM
          ? openEndedShortFormcommand
          : otherQuestionscommand;
      // Add humman message to the chat history
      this.chatHistoryService.setChatHistory(
        `${user?.userUUID}-openEndedQuizAi`,
        {
          role: 'user',
          content: command,
        },
      );

      // If the total token in the request is more than the limit, reduce the chat history
      this.chatHistoryService.reduceChatHistory(
        `${user?.userUUID}-openEndedQuizAi`,
      );

      // Get the chat history
      const chatHistory = this.chatHistoryService.getChatHistory(
        `${user?.userUUID}-openEndedQuizAi`,
      );

      // Make a request to the ChatGPT model
      const content = await this.chatCompletion(
        chatHistory,
        'You are an expert in all medical knowledge & can generate engaging medical quizes for healthcare professionals & students',
        user,
        this.maxToken,
      );

      // Add the AI message to the chat history
      this.chatHistoryService.setChatHistory(
        `${user?.userUUID}-openEndedQuizAi`,
        {
          role: 'assistant',
          content,
        },
      );

      // Deserialize the aiMessage
      const deserializeData = JSON.parse(content);

      return deserializeData?.questions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Grade open ended question
  async submitOpenEndedResponse(
    user: UserDocument,
    {
      responses,
      point,
      component,
      region,
      subComponent,
    }: SubmitOpenEndedResInput,
  ): Promise<OpenEndedQuizScoreRes> {
    try {
      if (responses) this.validateOpenEndedResponse(responses);

      const noCredit = this.checkUserCredit(user);

      const threadMessageInput: ThreadMessageInput = {
        threadId: '',
        message: '',
      };

      let totalPoints = 0;
      let totalQA = 0;
      let totalTimeTaken = 0;

      let totalSpeedBonus = 0;
      let totalAwardPoint = 0;

      if (noCredit) {
        const tempResult = await Promise.all(
          responses?.map(async (res) => {
            let individualSpeedBonus = 0;
            const individualAwardPoint = 0;

            if (Number(res?.timeTaken) <= 30) {
              individualSpeedBonus = 0;
              totalSpeedBonus += 0;
            }

            const newPoint = individualAwardPoint + individualSpeedBonus;
            totalPoints += newPoint;

            return {
              question: res,
              feedback: 'You need credit before your answer(s) can be graded',
              speedBonus: individualSpeedBonus,
              score: individualAwardPoint,
            };
          }),
        );

        return {
          overallGrade: {
            score: totalAwardPoint,
            speedBonus: totalSpeedBonus,
          },
          items: tempResult,
        };
      } else {
        const tempResult = await Promise.all(
          responses?.map(async (res) => {
            threadMessageInput.message = this.AIGradeDxQuestShortQuestion(res);

            let individualSpeedBonus = 0;
            let individualAwardPoint = 0;

            if (res?.userAnswer?.length === 0 || !res?.userAnswer) {
              const newPoint = individualAwardPoint + individualSpeedBonus;
              totalPoints += newPoint;
              totalQA += 1;
              totalTimeTaken += Number(res?.timeTaken);

              return {
                question: res,
                feedback:
                  'You scored 0 because your answer was empty. Please provide your answers for evaluation.',
                speedBonus: individualSpeedBonus,
                score: individualAwardPoint,
              };
            } else {
              const {
                message: content,
                threadId: chatThreadId,
                messageId,
              } = await this.asstThreadService.addMessage(
                user,
                threadMessageInput,
                ComponentType.DX_QUEST,
                null,
                null,
                null,
              );

              if (!isValidJSON(content)) {
                throw new BadRequestException(
                  'I am unable to process your request at this time. Please try again',
                );
              }

              const parsedContent = JSON.parse(content);

              if (parsedContent) {
                let checkPass = 0;
                parsedContent?.['score_per_item'].forEach((result) => {
                  if (result === 1) {
                    individualAwardPoint += point;
                    totalAwardPoint += point;
                    checkPass += 1;
                  }
                });
                if (checkPass > 0) {
                  if (Number(res?.timeTaken) <= 30) {
                    individualSpeedBonus = 2;
                    totalSpeedBonus += 2;
                  }
                }
              }
              const newPoint = individualAwardPoint + individualSpeedBonus;
              totalPoints += newPoint;
              totalQA += 1;
              totalTimeTaken += Number(res?.timeTaken);

              return {
                question: res,
                feedback: parsedContent?.['feedback'],
                speedBonus: individualSpeedBonus,
                score: individualAwardPoint,
              };
            }
          }),
        );

        user.quizzer.totalPoints += totalPoints;
        user.quizzer.totalQA += totalQA;
        user.quizzer.totalTimeTaken += totalTimeTaken;

        await this.userService.updateUser(user, true); // Update daily & weekly streaks & save user

        this.emitter.emit(LeaderBoardEventsType.ADD_SCORE, {
          user,
          component,
          points: totalPoints,
          timeTaken: totalTimeTaken,
          subComponent,
          region,
        });

        return {
          overallGrade: {
            score: totalAwardPoint,
            speedBonus: totalSpeedBonus,
          },
          items: tempResult,
        };
      }
    } catch (error) {
      throw new BadRequestException(
        'I am unable to process your request at this time. Please try again',
      );
    }
  }

  checkUserCredit(user: UserEntity) {
    try {
      return user?.subscription?.tokenBalance <= 0;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async scrapeWebPage(url: string): Promise<string> {
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      const html = response.data;

      // Load HTML into cheerio
      const $ = cheerio.load(html);

      // Extract the main content (for simplicity, we get all text from the body)
      const pageContent = $('body').text();

      return pageContent;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Extract text from pdf file
  async extractText(file: FileUpload, fileExtension: string): Promise<string> {
    try {
      const { createReadStream } = await file;

      const stream = createReadStream();

      // Read the file stream into a buffer
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Check if the file has a valid extension
      switch (fileExtension) {
        case FileExtType.PDF: {
          const { text } = await pdf(buffer);
          return text;
        }

        case FileExtType.DOCX: {
          const { value } = await mammoth.extractRawText({ buffer });
          return value;
        }

        default:
          throw new BadRequestException(
            'Invalid file type. Please upload a PDF or DOCX file.',
          );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Validate response (Check for duplicate question ID)
  validateOpenEndedResponse(responses: OpenEndedResponseInput[]) {
    try {
      const questionUUIDs = new Set<string>();

      responses.forEach((response) => {
        if (questionUUIDs.has(response?.questionUUID)) {
          throw new BadRequestException(
            'Duplicate or invalid question ID detected!',
          );
        }

        questionUUIDs.add(response?.questionUUID);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  AIGradeDxQuestQuestion(responses: OpenEndedResponseInput) {
    return `
        Strictly follow the instructions below to grade the quiz based on the following criteria. Assign a score out of 20 for each criterion. If the user answer is significantly off from the expected answer, assign a score of zero for Accuracy:
    
      1. **Accuracy**: Compare the user answer "${
        responses?.userAnswer
      }" which is an array, against the expected answer or expected answer details "${
      responses?.expectedAnswer
    }" that is and array and:
         - If the user answer closely matches the expected answer, assign a full score.
         - **If the user answer is off or incorrect**, assign a score of zero.
         - Deduct points for any minor inaccuracies or omissions.
         
      2. **Clarity and Conciseness**: Evaluate the user answer for readability and conciseness:
         - Is the answer easy to understand and free of unnecessary details or medical jargon?
         - Deduct points for lack of clarity, overly verbose sections, or excessively brief descriptions.
         
      3. **Relevance**: Ensure all included information is directly related to the expected answer:
         - Deduct points for irrelevant information or missing key details.
         - **If the answer is off-topic**, assign a score of zero for this criterion.
    
      4. **Organization and Structure**: Assess the logical flow and structure of the user answer:
         - Is the content well-organized and does it follow a logical sequence?
         - Deduct points for disorganized content or poor structure that affects readability.
    
      5. **Strict Grading**: Ensure that the user's answer aligns with the expected answer. If it does not, accuracy should be scored as zero.
    
      6. **Total Score**: The total score should be the sum of the results from "Accuracy", "Clarity and Conciseness", "Relevance", and "Organization and Structure".
    
      7. **Output Format**: Please ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
      {
          "description": "A brief description of the prompt",
          "accuracy": number,
          "clarityAndConciseness": number,
          "relevance": number,
          "organizationAndStructure": number,
          "totalScore": number
  }
    
      Provided content: ${JSON.stringify(responses)}

      8. Your response should not include unnecessary characters such as ${'```json ```'} on the response or returned result
    
      **Note**: 
        -If the user's answer does not align with the expected answer, the score for Accuracy should be zero.
        -If the user's answer does not have clarity and conciseness, then "Clarity and Conciseness" should be zero.
        -If the user's answer does not have any Relevance or does not conform to the expected answer, then "Relevance" should be zero.
        -If the user's answer does not have any organization and structure Relevance then, "Organization and Structure" should be zero.
      `;
  }

  AIGradeDxQuestShortQuestion(responses: OpenEndedResponseInput) {
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

  // Transform the questions before sending it
  transformQustions(questions: PromptRes[]) {
    try {
      return questions?.map((item) => {
        const options = item?.options?.map((optionItem) => ({
          id: this.uid.rnd(),
          value: optionItem,
        }));

        // Find the correct answer among the options
        const answerId = options?.find(
          (option) =>
            option.value.toLowerCase() === item?.answer?.toLowerCase(),
        )?.id;

        if (!answerId)
          throw new BadRequestException(
            'Cannot find answer in the options for one or more questions',
          );

        // Construct answer object
        const answer = {
          id: answerId,
          answer: item?.answer,
          reference: item?.reference || null,
          answer_details: item?.answer_details || null,
        };

        // Construct the transformed question object
        const question = {
          questionUUID: uuidv4(),
          question: item?.question,
          options,
          answer: answer,
          subtopic: item?.subtopic,
        };

        return question;
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Chat completion
  async chatCompletion(
    chat: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    systemMessage: string,
    user?: UserDocument,
    maxToken?: number,
  ) {
    try {
      const completion: ChatCompletion =
        await this.openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: systemMessage,
            },
            ...chat,
          ],
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: maxToken || 16384,
        });

      // Extract the content and finish_reason from the response
      const choices = completion.choices.map(
        ({ message: { content }, finish_reason }) => ({
          content,
          finish_reason,
        }),
      );

      const totalTokens = completion?.usage?.total_tokens || 0;

      if (user) {
        this.userService.deductCredit(user, totalTokens); // Update user's used credit

        await this.userService.updateUser(user, true); // Update daily & weekly streaks & save user
      }

      // Assuming we want the first choice
      const { content, finish_reason } = choices[0];

      // Chech if conversation is within token limit
      if (finish_reason === 'length')
        throw new BadRequestException('max_tokens limit exceeded.');

      // Chech if content is a valid json format
      if (!isValidJSON(content))
        throw new BadRequestException(
          'Unable to generating response at this time. Please try again later.',
        );

      return content;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
