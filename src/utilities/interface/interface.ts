import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { UserDocument } from 'src/user/entity/user.entity';
import { AICharacterEntityType } from 'src/chat-simulation/entities/types.entity';
import { EpisodeContent } from 'src/chat-simulation/dto/chat-simulation.input';
import { ScheduleType } from 'src/chat-simulation/enums/chat-simuation.enum';
import { SimulationQuiz } from 'src/chat-simulation/types/chat.types';
import { SimulationPoll } from 'src/chat-simulation/types/chat.types';

export type MailData = {
  firstName: string;
  otp?: string;
  templateId: string;
};

export type UserRanking = {
  _id: ObjectId;
  quizzer: { ranking: number };
  userUUID: string;
};

export type OnlineUser = {
  userUUID: string;
  clientID: string;
  connectedAt: Date;
};

export type PollInterval = {
  interval: NodeJS.Timeout;
};

export type SocketUser = {
  userUUID: string;
  userId?: ObjectId;
  firstName?: string;
  name?: string;
  code: string;
  url?: string;
  plan?: string;
  category?: string; // this is for tracking which category the engagement should belong to. example: presentation, slide, etc.
  data?: any;
};

export type RegData = {
  id?: string;
  email?: string;
  firstName: string;
  lastName: string;
  password?: string;
  picture?: string;
  guestUUID?: string;
};

export type InsertQuestion = {
  case_id?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  answer_details?: string;
  category: string;
  subcategory?: string;
  topic?: string;
  subtopic?: string;
  subject?: string;
  system?: string;
  comments?: string;
  reviewed?: string;
  reference?: string;
  keywords?: string;
  level?: number;
};

export class CategoryData {
  category: string;
  totalNumber: number;
  quizUUID: string;
  coverImage: string;
}

export type ChattHistory = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AIPromptArg = {
  caseSummary: string;
  userSummary: string;
  completionTime: string;
  assignedTime: string;
};

interface TopicSubtopic {
  topic: string;
  subtopics: string[];
}

export interface SystemTopics {
  system: string;
  data: TopicSubtopic[];
}

export interface GetQuestionsParam {
  userUUID: string;
  subcatId?: string;
  quizUUID?: string;
  caseUUID?: string;
  isContinue?: boolean;
  subspecialty?: string;
  systems?: SystemTopics[];
}

export type Streaks = {
  dailyStreak: number;
  weeklyStreak: number;
};

export interface ReqWithRawBody extends Request {
  rawBody: Buffer;
}

export type Webhook = {
  user: UserDocument;
  isWebhook: boolean;
};

export type CreateQuiz = {
  topic: string;
  quizCategory: string;
  description?: string;
  timer?: string;
  questionType?: string;
  point: number;
  duration: string;
  isPublish?: boolean;
  presUUID?: string;
  content?: string;
};

export type EpisodeQuiz = {
  title: string;
  quizType?: string;
  optionNo?: number;
  noOfQuestions?: number;
  noOfPolls?: number;
  quizThreadId?: string;
};

export type EpisodeData = {
  question: string;
  options: string[];
  answer?: string[];
  answer_details?: string;
  topic: string;
};

export type EpisodeQuizRes = {
  questions: EpisodeData[];
  polls: EpisodeData[];
};

export type SimulationOutput = {
  name: string;
  gender: string;
  conversation: string;
  voiceId: string;
};

export type SimulationPayload = {
  user: UserDocument;
  episodeContent: EpisodeContent[];
  threadId: string;
  actorCount: number;
  noOfPanelist: number;
  eventDescription: string;
  eventName: string;
  eventTemplate: string;
  category: string;
  channelDescription: string;
  channelName: string;
  characterDetails: AICharacterEntityType[];
  userPrompt: string;
  description: string;
  quizType: string;
  pollType: string;
  noOfQuestions: number;
  noOfEpisodes: number;
  scheduled: Date;
  scheduledType: ScheduleType;
  isQuiz: boolean;
  isPoll: boolean;
  wordCount: number;
  eventCoverImage: string;
};

export type SimulationItem = {
  episode: string;
  episodeTitle: string;
  episodeTopics: string;
  threadId: string;
  simulation: string;
  description: string;
  quiz: SimulationQuiz[];
  poll: SimulationPoll[];
};
