import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { ChatAIAvatarEntity } from '../entities/chat.avatar.entity';
import {
  ChatEpisodeEntity,
  ChatEpisodeWithProgress,
} from '../entities/chat-episode-entity';
import { Pagination } from 'src/quiz/types/quiz.types';
import { PaginationArgs } from 'src/quiz/dto/question.input';
import { EpisodeStatus } from '../enums/chat-simuation.enum';

@ObjectType()
export class GetAvatars {
  @Field(() => Number)
  page: number;

  @Field(() => Number)
  limit: number;

  @Field(() => Number)
  totalPages: number;

  @Field(() => Number)
  totalItems: number;

  @Field(() => [ChatAIAvatarEntity])
  data: ChatAIAvatarEntity[];
}

@ObjectType()
export class PollOptionsResType {
  @Field(() => String)
  id: string;

  @Field(() => String)
  value: string;

  @Field(() => Number)
  vote: number;
}

@ObjectType()
export class SimulationPoll {
  @Field(() => String)
  question: string;

  @Field(() => [PollOptionsResType])
  options: PollOptionsResType[];

  @Field(() => String, { nullable: true })
  answer: string;

  @Field(() => String, { nullable: true })
  answer_details: string;

  @Field(() => String)
  topic: string;
}

@ObjectType()
export class SimulationQuiz {
  @Field(() => String)
  answer: string;

  @Field(() => String)
  question: string;

  @Field(() => [String])
  options: string[];

  @Field(() => String)
  topic: string;

  @Field(() => String)
  answer_details: string;
}

@ObjectType()
export class SimulationQuizAndPoll {
  @Field(() => String, { nullable: true })
  answer: string;

  @Field(() => String)
  question: string;

  @Field(() => [String], { nullable: true })
  quizOptions: string[];

  @Field(() => [PollOptionsResType], { nullable: true })
  pollOptions: PollOptionsResType[];

  @Field(() => String, { nullable: true })
  topic: string;

  @Field(() => String, { nullable: true })
  answer_details: string;
}

@ObjectType()
export class AICharacterResType {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  bio: string;

  @Field(() => String, { nullable: true })
  persona: string;

  @Field(() => String, { nullable: true })
  quirks: string;

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => String, { nullable: true })
  catchPhrase: string;

  @Field(() => String, { nullable: true })
  role: string;
}

@ObjectType()
export class SimulationRes {
  @Field(() => String)
  episode: string;

  @Field(() => Number, { nullable: true })
  noOfEpisodes: number;

  @Field(() => String)
  quizType: string;

  @Field(() => String)
  threadId: string;

  @Field(() => String)
  pollType: string;

  @Field(() => Number)
  noOfQuestions: number;

  @Field(() => String)
  episodeTitle: string;

  @Field(() => [String])
  episodeTopics: string[];

  @Field(() => String)
  eventName: string;

  @Field(() => String)
  category: string;

  @Field(() => String)
  channelName: string;

  @Field(() => String)
  channelDescription: string;

  @Field(() => String)
  eventDescription: string;

  @Field(() => String, { nullable: true })
  eventOutline: string;

  @Field(() => Number)
  actorCount: number;

  @Field(() => [AICharacterResType], { nullable: true })
  characterDetails: AICharacterResType[];

  @Field(() => [SimulationQuiz], { nullable: true })
  quiz: SimulationQuiz[];

  @Field(() => [SimulationPoll], { nullable: true })
  poll: SimulationPoll[];

  @Field(() => String)
  simulation: string;
}

@ObjectType()
export class SimulationUpdateRes {
  @Field(() => String)
  episode: string;

  @Field(() => String)
  episodeTitle: string;

  // @Field(() => String, { nullable: true })
  // fileUrl?: string;

  // @Field(() => String, { nullable: true })
  // episodeDescription?: string;

  @Field(() => [SimulationQuiz], { nullable: true })
  quiz: SimulationQuiz[];

  @Field(() => [SimulationPoll], { nullable: true })
  poll: SimulationPoll[];

  @Field(() => String)
  simulation: string;
}

@ObjectType()
export class GroupedChatEpisodes {
  @Field(() => Date)
  scheduledDate: Date;

  @Field(() => [ChatEpisodeEntity])
  episodes: ChatEpisodeEntity[];
}

@ObjectType()
export class SimulationDataType {
  @Field(() => String)
  simulationUUID: string;

  @Field(() => String)
  episodeTitle: string;

  @Field(() => String, { nullable: true })
  fileUrl: string;

  @Field(() => Boolean, { nullable: true })
  isUploaded: boolean;

  @Field(() => String, { nullable: true })
  episodeDescription: string;

  @Field(() => String, {
    description: 'this is the episode name. Example, episode 1',
  })
  episode: string;

  @Field(() => Number)
  noOfEpisodes: number;

  @Field(() => [String], { nullable: true })
  episodeTopics: string[];

  @Field(() => String)
  eventName: string;

  @Field(() => String)
  category: string;

  @Field(() => String)
  channelName: string;

  @Field(() => String)
  channelDescription: string;

  @Field(() => String)
  eventDescription: string;

  @Field(() => String, { nullable: true })
  eventOutline?: string;

  @Field(() => Number, { nullable: true })
  actorCount: number;

  @Field(() => Number)
  noOfQuestions: number;

  @Field(() => [AICharacterResType])
  characterDetails: AICharacterResType[];

  @Field(() => String)
  quizType: string;

  @Field(() => String)
  pollType: string;

  @Field(() => String, { nullable: true })
  threadId: string;

  @Field(() => String)
  simulation: string;

  @Field(() => String, { nullable: true })
  scheduledType: string;

  @Field(() => Date, { nullable: true })
  scheduled: Date;

  @Field(() => String, { nullable: true })
  masterOutline: string;

  @Field(() => String, { nullable: true })
  episodeOutline: string;

  @Field(() => [SimulationQuiz], { nullable: true })
  quiz: SimulationQuiz[];

  @Field(() => [SimulationPoll], { nullable: true })
  poll: SimulationPoll[];

  @Field(() => String, { nullable: true })
  genPodStatus: EpisodeStatus;
}

@ObjectType()
export class GeneratedSimulationRes {
  @Field(() => [SimulationDataType])
  data: SimulationDataType[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class GetScheduledSimulationType {
  @Field(() => String, { nullable: true })
  episodeUUID: string;

  @Field(() => String)
  episode: string;

  @Field(() => String)
  episodeTitle: string;

  @Field(() => String)
  status: string;

  @Field(() => [String])
  episodeTopics: string[];

  @Field(() => Date)
  scheduled: Date;
}

@ObjectType()
export class GetScheduledSimulationRes {
  @Field(() => Number)
  weekNumber: number;

  @Field(() => [GetScheduledSimulationType])
  simulations: GetScheduledSimulationType[];
}

@ObjectType()
export class AIGeneratedEpisodeOutlineRes {
  @Field(() => String)
  title: string;

  @Field(() => Number)
  episode: number;

  @Field(() => [String])
  outline: string[];
}

@ObjectType()
export class ConvertSimulationRes {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => String, { nullable: true })
  gender?: string;

  @Field(() => String, { nullable: true })
  conversation: string;

  @Field(() => String, { nullable: true })
  time?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  read?: boolean;
}

@ObjectType()
export class ChatEpisodeRes {
  @Field(() => [ChatEpisodeEntity])
  episodes: ChatEpisodeEntity[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ArgsType()
export class EpisodesArgs extends PaginationArgs {
  @Field(() => String, {
    nullable: true,
  })
  eventName: string;
  @Field(() => String, {
    nullable: true,
  })
  episodeTitle: string;
}

@ObjectType()
export class GetChannelsType {
  @Field(() => String)
  channelName: string;

  @Field(() => String, { nullable: true })
  channelDescription: string;

  @Field(() => String, { nullable: true })
  channelCoverImage: string;

  @Field(() => String)
  channelUUID: string;

  @Field(() => Boolean)
  onGoingEpisode: boolean;
}

@ObjectType()
export class GetMobileChannelsRes {
  @Field(() => String, { nullable: true })
  category: string;

  @Field(() => [GetChannelsType], { nullable: true })
  channels: GetChannelsType[];
}

@ObjectType()
export class EventCurrentEpisodeType {
  @Field(() => String, { nullable: true })
  episode: string;

  @Field(() => String, { nullable: true })
  episodeUUID: string;

  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => String, { nullable: true })
  status: string;

  @Field(() => Date, { nullable: true })
  publishedDate: Date;
}

@ObjectType()
export class GetMobileChannelEventType {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  eventUUID: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  coverImage: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  onGoingEpisode: boolean;

  @Field(() => EventCurrentEpisodeType, { nullable: true })
  eventCurrentEpisode: EventCurrentEpisodeType;
}

@ObjectType()
export class GetMobileChannelEventsRes {
  @Field(() => String)
  channelName: string;

  @Field(() => String, { nullable: true })
  channelDescription: string;

  @Field(() => String, { nullable: true })
  channelCoverImage: string;

  @Field(() => [GetMobileChannelEventType], { nullable: true })
  events: GetMobileChannelEventType[];
}

@ObjectType()
export class EventEpisodeType extends EventCurrentEpisodeType {
  @Field(() => [String], { nullable: true })
  topics: string[];
}

@ObjectType()
export class GetMobileEventEpisodesRes {
  @Field(() => String, { nullable: true })
  eventName: string;

  @Field(() => String, { nullable: true })
  channelName: string;

  @Field(() => String, { nullable: true })
  eventDescription: string;

  @Field(() => String, { nullable: true })
  eventCoverImage: string;

  @Field(() => String, { nullable: true })
  eventUUID: string;

  @Field(() => [EventEpisodeType], { nullable: true })
  completedAndOngoingEpisodes: EventEpisodeType[];

  @Field(() => [EventEpisodeType], { nullable: true })
  upcomingEpisodes: EventEpisodeType[];
}

@ObjectType()
export class GetEpisodeSimulationRes {
  @Field(() => [ConvertSimulationRes], { nullable: true })
  userSimulation: ConvertSimulationRes[];
}

@ObjectType()
export class UserVisitedChannelsRes {
  @Field(() => [String])
  channels: string[];

  @Field(() => Date)
  visitedDate: Date;
}

@ObjectType()
export class EpisodeType {
  @Field(() => String)
  episode: string;

  @Field(() => String)
  episodeTitle: string;

  @Field(() => String)
  status: string;

  @Field(() => Date)
  scheduled: Date;

  @Field(() => String)
  episodeUUID: string;

  @Field(() => String, { nullable: true })
  joinCode?: string;

  @Field(() => String, { nullable: true })
  fileUrl?: string;
}

@ObjectType()
export class liveEpisodeType extends EpisodeType {
  @Field(() => String)
  eventName: string;

  @Field(() => String, { nullable: true })
  eventDescription: string;

  @Field(() => String, { nullable: true })
  eventCoverImage: string;
}

@ObjectType()
export class ChannelType {
  @Field(() => String)
  channelName: string;

  @Field(() => String)
  channelUUID: string;

  @Field(() => String, { nullable: true })
  channelCoverImage: string;

  @Field(() => String, { nullable: true })
  channelDescription: string;

  @Field(() => Boolean)
  isLive: boolean;
}

@ObjectType()
export class RandomCategoryType {
  @Field(() => String)
  categoryName: string;

  @Field(() => [ChannelType], { nullable: true })
  channels: ChannelType[];
}

@ObjectType()
export class RecentType extends EpisodeType {
  @Field(() => String)
  channelName: string;

  @Field(() => String)
  channelUUID: string;

  @Field(() => String)
  eventName: string;

  @Field(() => String, { nullable: true })
  eventCoverImage: string;

  @Field(() => String, { nullable: true })
  eventDescription: string;

  @Field(() => String)
  eventUUID: string;

  // @Field(()=>Boolean)
  // isLive: boolean
}

@ObjectType()
export class NextDiscoveryType {
  @Field(() => String)
  channelName: string;

  // @Field(()=>String)
  // channelUUID: string

  @Field(() => String)
  eventName: string;

  @Field(() => String, { nullable: true })
  eventCoverImage: string;

  @Field(() => String, { nullable: true })
  eventDescription: string;

  @Field(() => String)
  eventUUID: string;

  @Field(() => Boolean)
  isLive: boolean;
}

@ObjectType()
export class ChannelHomeFeedRes {
  @Field(() => [RecentType], { nullable: true })
  liveEpisode: RecentType[];

  @Field(() => RandomCategoryType, { nullable: true })
  category: RandomCategoryType;

  @Field(() => [RecentType], { nullable: true })
  recent: RecentType[];

  @Field(() => [RecentType], { nullable: true })
  suggested: RecentType[];

  @Field(() => [NextDiscoveryType], { nullable: true })
  next_discovery: NextDiscoveryType[];
}

@ObjectType()
export class ChannelsEpisodeType extends EpisodeType {
  @Field(() => String)
  eventName: string;

  @Field(() => String, { nullable: true })
  eventDescription: string;

  @Field(() => String, { nullable: true })
  eventCoverImage: string;
}

@ObjectType()
export class ChannelsEpisodeRes {
  @Field(() => [ChannelsEpisodeType], { nullable: true })
  episodes: ChannelsEpisodeType[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class ChannelsEventsType {
  @Field(() => String)
  channelName: string;

  @Field(() => String)
  eventName: string;

  @Field(() => String)
  eventUUID: string;

  @Field(() => String, { nullable: true })
  eventDescription: string;

  @Field(() => String, { nullable: true })
  eventCoverImage: string;
}

@ObjectType()
export class MobileChannelsEventsRes {
  @Field(() => [ChannelsEventsType], { nullable: true })
  events: ChannelsEventsType[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ObjectType()
export class GetChannelEventsAndEpisodesRes {
  @Field(() => String)
  channelName: string;

  @Field(() => String, { nullable: true })
  channelDescription: string;

  @Field(() => String, { nullable: true })
  channelCoverImage: string;

  @Field(() => Boolean)
  isFollowing: boolean;

  @Field(() => [ChannelsEpisodeType])
  episodes: ChannelsEpisodeType[];

  @Field(() => [ChannelsEpisodeType])
  events: ChannelsEpisodeType[];
}

@ObjectType()
export class MobileChannelRes {
  @Field(() => String)
  channelName: string;

  @Field(() => String)
  channelUUID: string;

  @Field(() => String, { nullable: true })
  channelCoverImage: string;

  @Field(() => String, { nullable: true })
  channelDescription: string;

  @Field(() => String)
  categoryName: string;

  @Field(() => Boolean)
  isFollowed: boolean;
}

@ObjectType()
export class SimulationEventDetailsRes {
  @Field(() => ChannelsEventsType, { nullable: true })
  eventDetails: ChannelsEventsType;

  @Field(() => [AICharacterResType], { nullable: true })
  hosts: AICharacterResType[];

  @Field(() => [ChannelsEpisodeType], { nullable: true })
  upNext: ChannelsEpisodeType[];
}

@ObjectType()
export class ChatMobileExporeChannelRes {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  coverImage: string;
}

@ObjectType()
export class UploadEpisodeRes {
  @Field(() => String, { nullable: true })
  tempFileUUID: string;

  @Field(() => String, { nullable: true })
  fileUrl: string;
}

@ObjectType()
export class PdfToMarkdownRes {
  @Field(() => String, { nullable: true })
  markdown: string;
}

@ObjectType()
export class GeneratePodcastRes {
  @Field(() => String, { nullable: true })
  fileUrl: string;
}

@ObjectType()
export class ChatChannelRes {
  @Field(() => String)
  name: string;

  @Field(() => String)
  channelUUID: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  categoryName?: string;

  @Field(() => String, { nullable: true })
  coverImage?: string;
}

@ObjectType()
export class ChatCategoryRes {
  @Field(() => String)
  name: string;

  @Field(() => String)
  categoryUUID: string;

  @Field(() => [ChatChannelRes])
  channels: ChatChannelRes[];
}

@ObjectType()
export class PodcastHomeFeedRes {
  @Field(() => [ChatEpisodeEntity])
  recentEpisodes: ChatEpisodeEntity[];

  @Field(() => [ChatEpisodeWithProgress])
  continueListening: ChatEpisodeWithProgress[];

  @Field(() => [ChatCategoryRes])
  categories: ChatCategoryRes[];
}

@ObjectType()
export class PodcastChatCategoriesRes {
  @Field(() => [ChatCategoryRes])
  categories: ChatCategoryRes[];

  @Field(() => Pagination)
  pagination: Pagination;
}

@ArgsType()
export class PodcastChatCategoriesArgs extends PaginationArgs {}
