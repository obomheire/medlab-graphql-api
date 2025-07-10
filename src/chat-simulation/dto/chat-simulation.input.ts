import { InputType, Field, PartialType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  ArrayMinSize,
  ValidateNested,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';
import { AICharacterType, ScheduleType } from '../enums/chat-simuation.enum';
import { Type } from 'class-transformer';
import { UniqueEpisodeNo } from './dto.validator';
import { GenderType } from 'src/llm-providers/openAI/enum/assistantAI.enum';

@InputType()
export class CategoryInput {
  @Field(() => String, { description: 'Category name' })
  @IsString()
  name: string;

  @Field(() => String, {
    description: 'Description to category name',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description: string;
}

@InputType()
export class CategoryUpdateInput extends PartialType(CategoryInput) {
  @Field(() => String)
  @IsString()
  categoryUUID: string;
}

@InputType()
export class ChannelInput {
  @Field(() => String, { description: 'Channel name' })
  @IsString()
  name: string;

  @Field(() => String, {
    description: 'Description to category name',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description: string;

  @Field(() => String)
  @IsString()
  categoryName: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  coverImage: string;
}

@InputType()
export class ChannelUpdateInput extends PartialType(ChannelInput) {
  @Field(() => String)
  @IsString()
  channelUUID: string;
}

@InputType()
export class AICharacterInput {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  bio: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  persona: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  quirks: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  image: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  catchPhrase: string;

  @Field(() => String, { defaultValue: AICharacterType.PANELIST })
  @IsString()
  @IsOptional()
  role: string;

  @Field(() => String, { nullable: true })
  @IsEnum(GenderType)
  @IsOptional()
  gender: GenderType;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  voiceId: string;
}

@InputType()
export class EventInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  channelName: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  noOfPanelist: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  noOfActors: number;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  quiz: boolean;

  @Field(() => String, { nullable: true, defaultValue: 'MULTICHOICE' })
  @IsString()
  @IsOptional()
  quizType: string;

  @Field(() => String, { nullable: true, defaultValue: 'MULTICHOICE' })
  @IsString()
  @IsOptional()
  pollType: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  poll: boolean;

  @Field(() => Number, { defaultValue: 1, nullable: true })
  @IsNumber()
  @IsOptional()
  @IsOptional()
  noOfQuestions: number;

  @Field(() => Number, { defaultValue: 1, nullable: true })
  @IsNumber()
  @IsOptional()
  noOfPolls: number;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  scheduled: Date;

  @Field(() => String, { nullable: true, defaultValue: ScheduleType.DAILY })
  @IsEnum(ScheduleType)
  @IsOptional()
  scheduledType: ScheduleType;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^(?:[01]?[0-9]|2[0-4]):([0-5][0-9])$/, {
    message: 'duration must be in the format HH:MM',
  })
  duration: string;

  @Field(() => [AICharacterInput], { nullable: true })
  @IsArray()
  @IsOptional()
  aiCharacters: AICharacterInput[];
}

@InputType()
export class EventUpdateInput extends PartialType(EventInput) {
  @Field(() => String)
  @IsString()
  eventUUID: string;
}

@InputType()
export class UpdateAICharacterInput extends PartialType(AICharacterInput) {
  @Field(() => String)
  @IsString()
  characterUUID: string;
}

@InputType()
export class AIAvatarInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  @IsUrl()
  image: string;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  status: boolean;

  @Field(() => String)
  @IsEnum(GenderType)
  gender: GenderType;

  @Field(() => String, { nullable: true })
  ethnicity: string;

  @Field(() => String, { nullable: true })
  voiceId: string;
}

@InputType()
export class AIAvatarUpdateInput extends PartialType(AIAvatarInput) {
  @Field(() => String)
  @IsString()
  avartUUID: string;
}

@InputType()
export class AICharacter {
  @Field(() => String)
  name: string;

  @Field(() => String)
  role: string;

  @Field(() => String, { nullable: true })
  bio: string;

  @Field(() => String, { nullable: true })
  quirks?: string;

  @Field(() => String, { nullable: true })
  persona?: string;

  @Field(() => String, { nullable: true })
  catchPhrase?: string;
}

@InputType()
export class SimulationInputDto {
  @Field(() => String)
  category: string;

  @Field(() => String)
  channelName: string;

  @Field(() => String)
  channelDescription: string;

  @Field(() => String)
  eventName: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^(?:[01]?[0-9]|2[0-4]):([0-5][0-9])$/, {
    message: 'duration must be in the format HH:MM',
  })
  duration: string;

  // @Field(() => Number, { nullable: true })
  wordCount: number;

  @Field(() => String, { nullable: true })
  eventDescription: string;

  @Field(() => String, { nullable: true })
  eventTemplate?: string;

  @Field(() => String)
  episodeTitle: string;

  @Field(() => [String])
  episodeTopics: string[];

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  noOfActors: number;

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  noOfPanelist: number;

  @Field(() => [AICharacter])
  characterDetails: AICharacter[];

  @Field(() => String, { nullable: true })
  description: string;
}

@InputType()
export class UpdateGeneratedSimulationRecordDto extends PartialType(
  SimulationInputDto,
) {
  @Field(() => String)
  simulationUUID: string;

  @Field(() => Date)
  scheduled: Date;

  @Field(() => String, { defaultValue: ScheduleType.DAILY })
  @IsEnum(ScheduleType)
  scheduledType: ScheduleType;
}

@InputType()
export class SimulationUpdateInputDto extends SimulationInputDto {
  @Field(() => String, { nullable: true })
  threadId: string;

  @Field(() => String)
  episode: string;

  @Field(() => String, { nullable: true, defaultValue: 'MULTICHOICE' })
  quizType: string;

  @Field(() => Number, { nullable: true, defaultValue: 1 })
  noOfEpisodes: number;

  @Field(() => String, { nullable: true, defaultValue: 'MULTICHOICE' })
  pollType: string;

  @Field(() => Number, { nullable: true, defaultValue: 2 })
  noOfQuestions: number;
}

@InputType()
export class EpisodeContent {
  @Field(() => String)
  title: string;

  @Field(() => [String])
  topic: string[];

  @Field(() => String)
  episode: string;

  @Field(() => String, { nullable: true })
  description: string;
}

@InputType()
export class ChatEpisodeInput {
  @Field(() => String)
  @IsString()
  eventName: string;

  @Field(() => Number, { defaultValue: 1 })
  @IsNumber()
  noOfEpisodes: number;

  @Field(() => [EpisodeContent])
  @IsArray()
  content: EpisodeContent[];
}

@InputType()
export class SimulationQuizInput {
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

@InputType()
export class PollOptionsType {
  @Field(() => String)
  id: string;

  @Field(() => String)
  value: string;

  @Field(() => Number)
  vote: number;
}

@InputType()
export class SimulationQuizAndPollInput {
  @Field(() => String, { nullable: true })
  answer: string;

  @Field(() => String)
  question: string;

  @Field(() => [String], { nullable: true })
  quizOptions: string[];

  @Field(() => [PollOptionsType], { nullable: true })
  pollOptions: PollOptionsType[];

  @Field(() => String)
  topic: string;

  @Field(() => String, { nullable: true })
  answer_details: string;
}

@InputType()
export class SimulationPollInput {
  @Field(() => String)
  question: string;

  @Field(() => [PollOptionsType])
  options: PollOptionsType[];

  @Field(() => String)
  topic: string;
}

@InputType()
export class AddChatEpisodeInput {
  // @Field(() => String)
  // @IsString()
  // episodeTitle: string;

  @Field(() => String)
  @IsString()
  eventName: string;

  // @Field(() => [String])
  // @IsArray()
  // episodeTopics: string[];

  // @Field(() => String) //for getting the current episode
  // @IsString()
  // episode: string;

  @Field(() => String, { nullable: true }) //for returning the simulation UUIDs so it can be removed
  @IsString()
  simulationUUID: string;

  // @Field(() => String)
  // @IsString()
  // simulation: string;

  // @Field(() => [SimulationQuizInput], { nullable: true })
  // @IsArray()
  // quiz: SimulationQuizInput[];

  // @Field(() => [SimulationPollInput], { nullable: true })
  // @IsArray()
  // poll: SimulationPollInput[];

  // @Field(() => Date)
  // @IsDate()
  // scheduled: Date;

  // @Field(() => String, { defaultValue: ScheduleType.DAILY })
  // @IsEnum(ScheduleType)
  // scheduledType: ScheduleType;
}

@InputType()
export class ChatEpisodeUpdateInput {
  @Field(() => String, { nullable: true })
  episodeTitle?: string;

  @Field(() => String, { nullable: true })
  eventName?: string;

  @Field(() => [String], { nullable: true })
  episodeTopics?: string[];

  @Field(() => String, { nullable: true })
  episodeOutline?: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => Date, { nullable: true })
  scheduled?: Date;

  @Field(() => String, { nullable: true })
  @IsEnum(ScheduleType)
  @IsOptional()
  scheduledType?: ScheduleType;
}

@InputType()
export class MasterOutlineTypes {
  @Field(() => String, { nullable: true })
  system: string;

  @Field(() => [String], { nullable: true })
  topics: string[];
}

@InputType()
export class VisitedEventEpisodeInput {
  @Field(() => String)
  eventName: string;

  @Field(() => String, { nullable: true })
  visitedEpisode: string;
}

@InputType()
export class GetEpisodeSimulationInput {
  @Field(() => String)
  episodeUUID: string;

  @Field(() => String, { nullable: true })
  episodeTitle: string;

  @Field(() => String)
  eventUUID: string;

  @Field(() => String, { nullable: true })
  channelName: string;

  @Field(() => String)
  eventName: string;
}

@InputType()
export class DemoUpdateEpisode {
  @Field(() => String)
  episodeUUID: string;

  @Field(() => String)
  scheduledDate: string;
}

@InputType()
export class UploadedEpisode {
  @Field(() => String, {
    description: 'The title of the uploaded episode',
  })
  episodeTitle: string;

  @Field(() => String, {
    description: 'The description of the uploaded episode',
  })
  episodeDescription: string;

  @Field(() => String, {
    description: 'The number of the episode i.e 1, 2, 3, etc.',
  })
  @Matches(/^\d+$/, {
    message: 'Episode must be a number string like "1", "2", "3", etc.',
  })
  episode: string; // Number of the episode i.e episode 1, episode 2, etc.

  @Field(() => String, {
    description: 'The url of the uploaded episode audio file',
    nullable: true,
  })
  @IsUrl()
  @IsOptional()
  fileUrl: string; // The temp file uuid of the uploaded episode audio file

  @Field(() => String, {
    description: 'The temp file uuid of the uploaded episode audio file',
  })
  @IsUUID()
  tempFileUUID: string; // The temp file uuid of the uploaded episode audio file
}

@InputType()
export class UploadedEpisodeInput {
  @Field(() => [UploadedEpisode])
  @IsArray()
  @IsNotEmpty()
  @Type(() => UploadedEpisode)
  @ValidateNested({ each: true })
  @UniqueEpisodeNo({
    message: 'Each episode number must be unique',
  })
  episodes: UploadedEpisode[];

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  eventUUID: string;
}

@InputType()
export class GeneratePodcastInput {
  @Field(() => [String])
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 simulation UUIDs are allowed' })
  @ArrayMinSize(1, { message: 'At least one simulation UUID is required' })
  @IsUUID('4', { each: true })
  @ArrayUnique({ message: 'Duplicate UUIDs are not allowed' })
  simulationUUIDs: string[];
}

@InputType()
export class AddChatEpisodesInput {
  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  eventNames: string[];

  @Field(() => String, { nullable: true })
  @IsUUID('4')
  @IsOptional()
  simulationUUID: string;
}
