import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessTokenAuthGuard } from 'src/auth/guard/accessToken.guard';
import { ChatSimulationService } from '../service/chat-simulation.service';
import {
  AddChatEpisodesInput,
  AIAvatarInput,
  AIAvatarUpdateInput,
  ChannelInput,
  ChannelUpdateInput,
  ChatEpisodeInput,
  ChatEpisodeUpdateInput,
  DemoUpdateEpisode,
  EventInput,
  EventUpdateInput,
  GeneratePodcastInput,
  MasterOutlineTypes,
  SimulationQuizAndPollInput,
  SimulationUpdateInputDto,
  UpdateGeneratedSimulationRecordDto,
  UploadedEpisodeInput,
} from '../dto/chat-simulation.input';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { ChatCategoryEntity } from '../entities/chat-category.entity';
import { ChatChannelEntity } from '../entities/chat-channel.entity';
import { ChatEventEntity } from '../entities/chat-event.entity';
import { ChatAIAvatarEntity } from '../entities/chat.avatar.entity';
import {
  AIGeneratedEpisodeOutlineRes,
  ChatEpisodeRes,
  EpisodesArgs,
  GeneratedSimulationRes,
  GetAvatars,
  GetScheduledSimulationRes,
  GroupedChatEpisodes,
  PdfToMarkdownRes,
  SimulationQuiz,
  SimulationQuizAndPoll,
  SimulationUpdateRes,
  UploadEpisodeRes,
} from '../types/chat.types';
import { ChatEpisodeEntity } from '../entities/chat-episode-entity';
import { EpisodeStatus } from '../enums/chat-simuation.enum';
import {
  ConvertSimulationType,
  MasterOutlineRes,
} from '../entities/types.entity';
import { MessageRes } from 'src/auth/types/auth.types';
import { ChatAIRolesEntity } from '../entities/chat.roles.entity';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { UserDocument } from 'src/user/entity/user.entity';
import { DataRes } from 'src/stripe/types/stripe.types';
import { convertDocxToHtml } from 'src/utilities/service/convertToMarkDown';
import { Permissions } from 'src/user/decorator/permissions.decorator';
import { PermissionsType } from 'src/user/enum/user.enum';
import { PermissionsGuard } from 'src/user/guard/permissions.guard';

@Resolver()
export class ChatSimulationResolver {
  constructor(private readonly chatSimulationService: ChatSimulationService) {}

  //Section for category
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  addChatCategory(@Args('name') name: string) {
    return this.chatSimulationService.addChatCategory(name);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  updateChatCategory(
    @Args('name') name: string,
    @Args('categoryUUID') categoryUUID: string,
  ) {
    return this.chatSimulationService.updateChatCategory(name, categoryUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  deleteChatCategory(@Args('categoryUUID') categoryUUID: string) {
    return this.chatSimulationService.deleteChatCategory(categoryUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [ChatCategoryEntity])
  getChatCategories() {
    return this.chatSimulationService.getChatCategories();
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatCategoryEntity)
  getChatCategory(@Args('categoryUUID') categoryUUID: string) {
    return this.chatSimulationService.getChatCategory(categoryUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatCategoryEntity)
  getChatCategoryByName(@Args('categoryName') categoryName: string) {
    return this.chatSimulationService.getChatCategoryByName(categoryName);
  }

  //Section for channels
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  addChatChannel(
    @Args({ name: 'addChannelInput', type: () => [ChannelInput] })
    addChannelInput: ChannelInput[],
  ) {
    return this.chatSimulationService.addChatChannels(addChannelInput);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  updateChatChannel(
    @Args('channelUpdateInput') channelUpdateInput: ChannelUpdateInput,
    @Args({ name: 'coverImage', type: () => GraphQLUpload, nullable: true })
    coverImage: FileUpload,
  ) {
    return this.chatSimulationService.updateChatChannel(
      channelUpdateInput,
      coverImage,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  deleteChatChannel(@Args('channelUUID') channelUUID: string) {
    return this.chatSimulationService.deleteChatChannel(channelUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [ChatChannelEntity])
  getChatChannels() {
    return this.chatSimulationService.getChatChannels();
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatChannelEntity)
  getChatChannel(@Args('channelUUID') channelUUID: string) {
    return this.chatSimulationService.getChatChannel(channelUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatChannelEntity)
  getChatChannelByName(@Args('channelName') channelName: string) {
    return this.chatSimulationService.getChatChannelByName(channelName);
  }

  //Section for Events
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => ChatEventEntity)
  addChatEvent(
    @Args('addEventInput') addEventInput: EventInput,
    @Args({ name: 'coverImage', type: () => GraphQLUpload, nullable: true })
    coverImage: FileUpload,
    @Args({ name: 'eventTemplate', type: () => GraphQLUpload })
    eventTemplate: FileUpload,
    @Args({ name: 'masterOutline', type: () => GraphQLUpload, nullable: true })
    masterOutline: FileUpload,
    @Args({ name: 'eventUUID', nullable: true, type: () => String })
    eventUUID: string,
    @Args({ name: 'isDraft', nullable: true, type: () => Boolean })
    isDraft: boolean,
  ) {
    return this.chatSimulationService.addChatEvent(
      addEventInput,
      coverImage,
      eventTemplate,
      masterOutline,
      isDraft,
      eventUUID,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  updateChatEvent(
    @Args('eventUpdateInput') eventUpdateInput: EventUpdateInput,
    @Args({ name: 'coverImage', type: () => GraphQLUpload, nullable: true })
    coverImage: FileUpload,
    @Args({ name: 'masterOutline', type: () => GraphQLUpload, nullable: true })
    masterOutline: FileUpload,
    @Args({ name: 'eventOutline', type: () => GraphQLUpload, nullable: true })
    eventOutline: FileUpload,
  ) {
    return this.chatSimulationService.updateChatEvent(
      eventUpdateInput,
      coverImage,
      eventOutline,
      masterOutline,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  deleteChatEvent(@Args('eventUUID') eventUUID: string) {
    return this.chatSimulationService.deleteChatEvent(eventUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [ChatEventEntity])
  getChatEvents(
    @Args({ name: 'isDraft', nullable: true, type: () => Boolean })
    isDraft: boolean,
  ) {
    return this.chatSimulationService.getChatEvents(isDraft);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatEventEntity)
  getChatEvent(@Args('eventUUID') eventUUID: string) {
    return this.chatSimulationService.getChatEvent(eventUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatEventEntity)
  getChatEventByName(@Args('eventName') eventName: string) {
    return this.chatSimulationService.getChatEventByName(eventName);
  }

  @Query(() => [ConvertSimulationType])
  async getCompletedSimulation(@Args('episodeUUID') episodeUUID: string) {
    return await this.chatSimulationService.getCompletedSimulation(episodeUUID);
  }

  // Add Episode with multiple event names
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  addChatEpisodes(
    @Args('addChatEpisodesInput') addChatEpisodesInput: AddChatEpisodesInput,
  ) {
    return this.chatSimulationService.addChatEpisodes(addChatEpisodesInput);
  }

  // Query to get all episodes
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatEpisodeRes)
  async getAllEpisodes(@Args() episodesArgs: EpisodesArgs) {
    const { page, limit, eventName, episodeTitle } = episodesArgs;
    return await this.chatSimulationService.getAllEpisodes(
      true,
      Math.max(page, 1),
      Math.max(limit, 1),
      eventName,
      episodeTitle,
    );
  }

  // Query to get an episode by ID
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatEpisodeEntity)
  async getEpisodeById(
    @Args('episodeUUID', { type: () => String }) episodeUUID: string,
  ): Promise<ChatEpisodeEntity> {
    return this.chatSimulationService.getEpisodeById(episodeUUID);
  }

  // Query to get episodes by name
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [ChatEpisodeEntity])
  async getEpisodesByName(
    @Args('episodeTitle', { type: () => String }) episodeTitle: string,
    @Args('eventName', { type: () => String }) eventName: string,
  ): Promise<ChatEpisodeEntity[]> {
    return this.chatSimulationService.getEpisodesByName(
      episodeTitle,
      eventName,
    );
  }

  // Mutation to update an episode
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => ChatEpisodeEntity)
  async updateEpisode(
    @Args('episodeUUID', { type: () => String }) episodeUUID: string,
    @Args('updateData', { type: () => ChatEpisodeUpdateInput })
    updateData: Partial<ChatEpisodeEntity>,
  ): Promise<ChatEpisodeEntity> {
    return this.chatSimulationService.updateEpisode(episodeUUID, updateData);
  }

  // Mutation to delete an episode
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => Boolean)
  async deleteEpisode(
    @Args('episodeUUID', { type: () => String }) episodeUUID: string,
  ): Promise<boolean> {
    return this.chatSimulationService.deleteEpisode(episodeUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [GroupedChatEpisodes])
  getEpisodesForcalendar(
    @Args({ name: 'startDate', type: () => String, nullable: true })
    startDate: string,
    @Args({ name: 'endDate', type: () => String, nullable: true })
    endDate: string,
  ) {
    return this.chatSimulationService.getEpisodesForCalendar(
      startDate,
      endDate,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [SimulationQuizAndPoll])
  getQuizByEventNameAndEpisode(
    @Args({ name: 'eventName', type: () => String }) eventName: string,
    @Args({ name: 'episode', type: () => String }) episode: string,
    @Args({ name: 'requestType', type: () => String }) requestType: string,
  ) {
    return this.chatSimulationService.getQuizByEventNameAndEpisode(
      eventName,
      episode,
      requestType,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  updateSimulationEpisode(
    @Args('simulationUpdatePayload')
    simulationUpdatePayload: UpdateGeneratedSimulationRecordDto,
  ) {
    return this.chatSimulationService.updateSimulationEpisode(
      simulationUpdatePayload,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  deleteSimulationEpisode(
    @Args('simulationUUID') simulationUUID: string,
    // @Args("eventName") eventName: string
  ) {
    return this.chatSimulationService.deleteSimulationEpisode(simulationUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  updatePollAndQuizByEventNameAndEpisode(
    @Args({ name: 'eventName', type: () => String }) eventName: string,
    @Args({ name: 'episode', type: () => String }) episode: string,
    @Args({ name: 'requestType', type: () => String }) requestType: string,
    @Args({
      name: 'quizAndPollPayload',
      type: () => [SimulationQuizAndPollInput],
    })
    quizAndPollPayload: SimulationQuizAndPollInput[],
  ) {
    return this.chatSimulationService.updatePollAndQuizByEventNameAndEpisode(
      eventName,
      episode,
      requestType,
      quizAndPollPayload,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [SimulationQuiz])
  getQuizzesByChatEventName(
    @Args({ name: 'eventName', type: () => String, nullable: true })
    eventName: string,
  ) {
    return this.chatSimulationService.getQuizzesByChatEventName(eventName);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatEpisodeEntity)
  changeEpisodeStatus(
    @Args('episodeUUID') episodeUUID: string,
    @Args('status') status: EpisodeStatus,
  ) {
    return this.chatSimulationService.changeEpisodeStatus(episodeUUID, status);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => SimulationUpdateRes)
  generateUpdatedSimulation(
    @Args('updateEpisodeInput') updateEpisodeInput: SimulationUpdateInputDto,
    @Args({ name: 'userPrompt', type: () => String, nullable: true })
    userPrompt?: string,
  ) {
    return this.chatSimulationService.generateUpdatedSimulation(
      updateEpisodeInput,
      userPrompt,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => [AIGeneratedEpisodeOutlineRes])
  aiGenerateEpisodeOutline(
    @Args('noOfEpisode') noOfEpisode: number,
    @Args({ name: 'eventName', type: () => String, nullable: true })
    eventName?: string,
    @Args({
      name: 'outlines',
      type: () => [MasterOutlineTypes],
      nullable: true,
    })
    outlines?: MasterOutlineTypes[],
    @Args({ name: 'prompt', type: () => String, nullable: true })
    prompt?: string,
  ) {
    return this.chatSimulationService.aiGenerateEpisodeOutline(
      noOfEpisode,
      eventName,
      prompt,
      outlines,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  uploadMasterOutline(
    @Args({ name: 'eventName', type: () => String })
    eventName?: string,
    @Args({ name: 'masterOutline', type: () => GraphQLUpload })
    masterOutline?: FileUpload,
  ) {
    return this.chatSimulationService.uploadMasterOutline(
      eventName,
      masterOutline,
    );
  }

  //Resolver for getting master outline
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [MasterOutlineRes])
  getMasterOutline(@Args('eventName') eventName: string) {
    return this.chatSimulationService.getMasterOutline(eventName);
  }

  //Section for AI Character
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  addChatAIAvatar(
    @Args({ name: 'aIAvatarInput', type: () => [AIAvatarInput] })
    aIAvatarInput: AIAvatarInput[],
  ) {
    return this.chatSimulationService.addChatAIAvatar(aIAvatarInput);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => GetAvatars)
  getChatAvatars(
    @Args({ name: 'page', type: () => Number, nullable: true, defaultValue: 1 })
    page?: number,
    @Args({
      name: 'limit',
      type: () => Number,
      nullable: true,
      defaultValue: 100,
    })
    limit?: number,
  ) {
    return this.chatSimulationService.getAvatars(page, limit);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => ChatAIAvatarEntity)
  getChatAvatar(@Args('avatarUUID') avatarUUID: string) {
    return this.chatSimulationService.getAvatar(avatarUUID);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  udpdateChatAvatar(
    @Args({ name: 'aiAvatarUpdateInput', type: () => [AIAvatarUpdateInput] })
    aiAvatarUpdateInput: AIAvatarUpdateInput[],
  ) {
    return this.chatSimulationService.udpdateAvatar(aiAvatarUpdateInput);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  deleteChatAvatar(@Args('avatarUUID') avatarUUID: string) {
    return this.chatSimulationService.deleteAiAvatar(avatarUUID);
  }

  //Section for extracting topics
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  extractOutlineToJson(
    @Args({ name: 'outline', type: () => GraphQLUpload, nullable: true })
    outline: FileUpload,
  ) {
    return this.chatSimulationService.extractOutlineToJson(outline);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  generateSimulation(
    @Args('chatEpisodeInput')
    chatEpisodeInput: ChatEpisodeInput,
    @Args({ name: 'userPrompt', type: () => String, nullable: true })
    userPrompt?: string,
    @Args({ name: 'threadId', type: () => String, nullable: true })
    threadId?: string,
  ) {
    return this.chatSimulationService.generateSimulation(
      chatEpisodeInput,
      threadId,
      userPrompt,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => GeneratedSimulationRes)
  async getQueuedSimulations(
    @Args({ name: 'eventName', type: () => String, nullable: true })
    eventName: string,
    @Args({ name: 'page', type: () => Number, nullable: true }) page: number,
    @Args({ name: 'limit', type: () => Number, nullable: true }) limit: number,
  ): Promise<GeneratedSimulationRes> {
    return await this.chatSimulationService.getQueuedSimulations(
      eventName,
      page,
      limit,
    );
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [GetScheduledSimulationRes])
  async getScheduledSimulationsByWeek(
    @Args({ name: 'eventName', type: () => String, nullable: true })
    eventName: string,
  ) {
    return this.chatSimulationService.getScheduledSimulationsByWeek(eventName);
  }

  //Section for addin roles
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => String)
  AddChatAIRoles(@Args('role') role: string) {
    return this.chatSimulationService.AddChatAIRoles(role);
  }

  @UseGuards(AccessTokenAuthGuard)
  @Query(() => [ChatAIRolesEntity])
  getAllChatAIRoles() {
    return this.chatSimulationService.getAllChatAIRoles();
  }

  // Upload episode
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => UploadEpisodeRes)
  async uploadEpisode(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
  ) {
    return await this.chatSimulationService.uploadEpisode(file);
  }

  // Save uploaded episode
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  createUploadedEpisode(
    @GetUser() user: UserDocument,
    @Args('uploadedEpisodeInput')
    uploadedEpisodeInput: UploadedEpisodeInput,
  ) {
    return this.chatSimulationService.createUploadedEpisode(
      user,
      uploadedEpisodeInput,
    );
  }

  // Generate podcast
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => MessageRes)
  async generatePodcast(
    @GetUser() user: UserDocument,
    @Args('generatePodcastInput')
    { simulationUUIDs }: GeneratePodcastInput,
  ) {
    return await this.chatSimulationService.generatePodcast(
      user,
      simulationUUIDs,
    );
  }

  // Convert PDF to Markdown (TESTING ONLY)
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => PdfToMarkdownRes)
  convertPdfToMarkdown(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
  ) {
    return this.chatSimulationService.convertPdfToMarkdown(file);
  }

  /**
   *
   * Demo Sumulation API for Samuel to simulate and integrate
   */
  @UseGuards(AccessTokenAuthGuard)
  @Query(() => MessageRes)
  async demoTriggerLiveEpisode(
    @Args('demoUpdateEpisode')
    { episodeUUID, scheduledDate }: DemoUpdateEpisode,
  ) {
    return await this.chatSimulationService.demoTriggerLiveEpisode(
      episodeUUID,
      scheduledDate,
    );
  }

  // Upload episode (TESTING ONLY)
  @UseGuards(AccessTokenAuthGuard)
  @Mutation(() => DataRes)
  async convertDocxToHtml(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
  ) {
    const html = await convertDocxToHtml(file);
    return { data: html };
  }

  // Assign join codes to episodes (DEV ONLY)
  @UseGuards(AccessTokenAuthGuard, PermissionsGuard)
  @Permissions(PermissionsType.SUPER_ADMIN)
  @Mutation(() => DataRes)
  async assignJoinCodesToEpisodes() {
    return await this.chatSimulationService.assignJoinCodesToEpisodes();
  }
}
