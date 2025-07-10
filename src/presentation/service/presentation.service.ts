import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import {
  getPagination,
  isValidJSON,
} from 'src/utilities/service/helpers.service';
import {
  PresentationDocument,
  PresentationEntity,
} from '../entity/presentation.entity';
import { AIasistantService } from 'src/llm-providers/openAI/service/ai.assistant.service';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { QuizAIService } from 'src/llm-providers/openAI/service/ai.quiz.service';
import { UserDocument } from 'src/user/entity/user.entity';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import {
  ConfigPresInput,
  PreviewInp,
  PresInput,
  UpdatePresInput,
  PresImageInput,
} from '../dto/presentation.input';
import { PresPromptType, QuizOrPollType } from '../enum/presentation.enum';
import { GameService } from 'src/quiz/service/game.service';
import ShortUniqueId from 'short-unique-id';
import { EngageType } from 'src/quiz/enum/quiz.enum';
import { Pagination } from 'src/quiz/types/quiz.types';
import { GameDocument, GameEntity } from 'src/quiz/entity/game.entity';
import { QuizPromptInput } from 'src/llm-providers/openAI/dto/quizAI.input';
import { WsEngagementService } from 'src/ws/service/ws.engagement.service';
import { QuizAIRes } from 'src/llm-providers/openAI/types/ai.type';
import Bottleneck from 'bottleneck';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { Readable } from 'stream';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { WsNotificationService } from 'src/ws/service/ws.notification.service';

@Injectable()
export class PresentationService {
  private readonly uid = new ShortUniqueId({ length: 6 });
  private readonly uiQuiz = new ShortUniqueId({ length: 16 });
  private readonly logger = new Logger(PresentationService.name);

  constructor(
    @InjectModel(PresentationEntity.name)
    private readonly presentationModel: Model<PresentationDocument>,
    @InjectModel(GameEntity.name)
    private readonly gameModel: Model<GameEntity>,
    private readonly awsS3Service: AwsS3Service,
    private readonly aiAssistantService: AIasistantService,
    private readonly asstThreadService: AsstThreadService,
    private readonly quizAIService: QuizAIService,
    private readonly gameService: GameService,
    private readonly wsEngagementService: WsEngagementService,
    private readonly httpService: HttpService,
    private readonly wsNotificationService: WsNotificationService,
  ) {}

  // Configure presentation
  async configPresentation(
    user: UserDocument,
    configPresInput: ConfigPresInput,
    files?: FileUpload[],
  ) {
    try {
      const { threadId, presPromptType, theme: background } = configPresInput;
      const { firstName, lastName } = user;

      const response = await this.asstThreadService.addMessage(
        user,
        {
          threadId,
          message: this.getPrompt(
            configPresInput,
            firstName,
            lastName,
            files,
            user?.specialty,
            user?.profileImage,
          ),
        },
        ComponentType.SLIDE_PRESENTATION,
        '',
        presPromptType === PresPromptType.PRESENTATION_OUTLINE && files,
        'slide-presentation-files',
      );

      let message: any;

      if (!isValidJSON(response?.message)) {
        message = await this.asstThreadService.getValidateJSON(
          response?.message,
        );
      } else {
        message = JSON.parse(response?.message);
      }

      let slides: any;
      let theme: string;

      if (presPromptType === PresPromptType.PRESENTATION_SLIDE) {
        message.slides = await Promise.all(
          message.slides.map(async (slide: any) => {
            if (slide.slide0) {
              // const cleanSlideText = slide.slide0.replace('<br>', '\n');
              const payload = {
                prompt: slide.image,
                slideNo: 0,
                themeNo: 0,
                isTheme: false,
                image: '',
              };
              const imageUrl = await this.generateCoverSlideImage([payload]);
              return {
                ...slide,
                slide0: slide.slide0,
                image: imageUrl,
              };
            }
            return slide;
          }),
        );
      }

      // Extract content and update message field
      return {
        ...response,
        message: message?.content,
        slides: message?.slides,
        script: message?.script,
        theme: background || theme,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Submit presentation
  async createPresentation(
    user: UserDocument,
    presInput: PresInput,
  ): Promise<PresentationDocument> {
    try {
      const { _id: userId } = user;
      const baseTitle = presInput.title;

      // Find all titles that match base or base (n)
      const regex = new RegExp(`^${baseTitle}( \\((\\d+)\\))?$`, 'i');
      const existingPres = await this.presentationModel.find({
        title: regex,
        userId,
      });

      if (existingPres.length) {
        // Extract numbers in parentheses and find the max
        const maxSuffix = existingPres.reduce((max, doc) => {
          const match = doc.title.match(/\((\d+)\)$/);
          const num = match ? parseInt(match[1], 10) : 0;
          return Math.max(max, num);
        }, 0);

        presInput.title = `${baseTitle} (${maxSuffix + 1})`;
      }

      const document = new this.presentationModel({
        ...presInput,
        userId,
      });

      return await document.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Start presentation
  async startPresentation(presUUID: string, userUUID: string) {
    try {
      const presentation = await this.getPresentation(presUUID);

      const user = presentation.userId as unknown as UserDocument; // populate usrerfrom presentation

      // check if user is the owner of the presentation
      if (userUUID !== user.userUUID) {
        throw new BadRequestException(
          'You are not authorized to start this presentation',
        );
      }

      const { slidesPreview } = presentation;
      const inviteCode = this.uid.rnd(); // generate invite code

      const engagement = this.getEngagement(slidesPreview);

      // create audience game
      await this.gameService.createAudienceGame(
        user,
        presentation._id,
        inviteCode,
        engagement,
      );

      // Update and return the updated presentation
      const updatedPresentation =
        await this.presentationModel.findByIdAndUpdate(
          presentation._id,
          { inviteCode },
          { new: true, runValidators: true }, // Return the updated document
        );
      if (
        updatedPresentation.activateAIComment &&
        !updatedPresentation.activateAIQuestion
      ) {
        this.wsEngagementService.startAIComment(
          updatedPresentation.presUUID,
          'slide',
        );
      }

      if (
        updatedPresentation.activateAIComment &&
        updatedPresentation.activateAIQuestion
      ) {
        // Start comment first, wait, then question
        await this.wsEngagementService.startAIComment(
          updatedPresentation.presUUID,
          'slide',
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.wsEngagementService.startAIQuestion(
          updatedPresentation.presUUID,
          'slide',
        );
      } else if (
        !updatedPresentation.activateAIComment &&
        updatedPresentation.activateAIQuestion
      ) {
        this.wsEngagementService.startAIQuestion(
          updatedPresentation.presUUID,
          'slide',
        );
      }

      return updatedPresentation;
    } catch (error) {
      this.logger.error('Error in startPresentation', error);
      throw new BadRequestException(error.message);
    }
  }

  // Get all presentations
  async getPresentations(
    userId: ObjectId,
    accessMode?: string,
    isDraft?: boolean,
    page?: number,
    limit?: number,
  ): Promise<{
    presentations: PresentationDocument[];
    pagination: Pagination;
  }> {
    try {
      const query: any = {
        userId,
        ...(isDraft !== undefined ? { isDraft } : {}),
      };

      if (accessMode === 'PUBLIC') {
        query.isPublic = true;
      } else if (accessMode === 'PRIVATE') {
        query.isPublic = false;
      }

      const presentations = await this.presentationModel
        .find(query)
        .populate('userId')
        .sort({ createdAt: -1 })
        .exec();

      const pagination: Pagination = await getPagination(
        this.presentationModel,
        query,
        presentations,
        limit,
        page,
      );

      return { presentations, pagination };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get a single presentation by UUID
  async getPresentation(presUUID: string): Promise<PresentationDocument> {
    try {
      const presentation = await this.presentationModel
        .findOne({
          presUUID,
        })
        .populate('userId')
        .exec();

      if (!presentation) {
        throw new BadRequestException(
          `Presentation with UUID ${presUUID} not found`,
        );
      }

      return presentation;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get presentation by invite code
  async getPresNextQuestion(
    inviteCode: string,
    questionType?: string,
  ): Promise<PresentationDocument | any> {
    try {
      const foundPlayedQuestion =
        await this.gameService.fetchPlayedPresQuestion(inviteCode);
      const foundQuestionsUUID = foundPlayedQuestion.map(
        (question) => question.presQuestionUUID,
      );

      const presentation = await this.presentationModel
        .findOne({
          inviteCode,
        })
        .populate('userId') // Populate the userId field
        .exec();

      if (!presentation)
        throw new BadRequestException(`Invalid invite info provided`);
      const foundEngagement = this.getEngagement(
        presentation.slidesPreview,
        questionType,
      );

      const filteredQuestions = foundEngagement.flatMap((prev) => {
        return prev?.questions?.filter((question) => {
          return !foundQuestionsUUID?.some((played) =>
            question.presQuestionUUID.includes(played),
          );
        });
      });
      return filteredQuestions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get presentation by invite code
  async getTotalQuestions(
    inviteCode: string,
    questionType?: string,
  ): Promise<{ totalQuestions: number; totalPlayedQuestions: number }> {
    try {
      const foundPlayedQuestion =
        await this.gameService.fetchPlayedPresQuestion(inviteCode);
      const foundQuestionsUUID = foundPlayedQuestion.map(
        (question) => question.presQuestionUUID,
      );
      const presentation = await this.presentationModel
        .findOne({
          inviteCode,
        })
        .populate('userId') // Populate the userId field
        .exec();

      if (!presentation)
        throw new BadRequestException(`Invalid invite info provided`);
      const foundEngagement = this.getEngagement(
        presentation.slidesPreview,
        questionType,
      );

      const filteredQuestions = foundEngagement.flatMap((prev) => {
        return prev?.questions?.filter((question) => {
          return !foundQuestionsUUID?.some((played) =>
            question.presQuestionUUID.includes(played),
          );
        });
      });

      const totalPlayedQuestions = foundPlayedQuestion.filter((question) =>
        question.type.includes(questionType),
      );

      const result = {
        totalQuestions: filteredQuestions.length + totalPlayedQuestions.length,
        totalPlayedQuestions: totalPlayedQuestions.length,
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getPresByInviteCode(
    inviteCode: string,
    questionType?: string,
  ): Promise<PresentationDocument | any> {
    try {
      const presentation = await this.presentationModel
        .findOne({
          inviteCode,
        })
        .populate('userId') // Populate the userId field
        .exec();

      if (!presentation)
        throw new BadRequestException(`Invalid invite info provided`);

      if (questionType) {
        return this.getEngagement(presentation.slidesPreview, questionType);
      }

      return presentation;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update presentation
  async updatePresentation(
    updatePresInput: UpdatePresInput,
  ): Promise<PresentationDocument> {
    try {
      const { presUUID, title } = updatePresInput;

      const existingPres = await this.presentationModel.findOne({ presUUID });
      if (!existingPres) {
        throw new BadRequestException(
          `Presentation with UUID ${presUUID} not found`,
        );
      }

      // If title is being updated
      if (title && title !== existingPres.title) {
        const baseTitle = title;
        const regex = new RegExp(`^${baseTitle}( \\((\\d+)\\))?$`, 'i');

        const conflicts = await this.presentationModel.find({
          title: regex,
          userId: existingPres.userId,
          presUUID: { $ne: presUUID }, // Exclude current presentation
        });

        if (conflicts.length) {
          const maxSuffix = conflicts.reduce((max, doc) => {
            const match = doc.title.match(/\((\d+)\)$/);
            const num = match ? parseInt(match[1], 10) : 0;
            return Math.max(max, num);
          }, 0);

          updatePresInput.title = `${baseTitle} (${maxSuffix + 1})`;
        }
      }

      const updatedPres = await this.presentationModel.findOneAndUpdate(
        { presUUID },
        updatePresInput,
        { new: true, runValidators: true },
      );

      return updatedPres;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete presentation
  async deletePresentation(presUUID: string): Promise<{ message: string }> {
    try {
      const presentation = await this.getPresentation(presUUID);

      await presentation.deleteOne();

      return {
        message: 'Presentation deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Generate images for applicable slides
  async generateSlideImage(message: any) {
    try {
      const limiter = new Bottleneck({
        maxConcurrent: 2,
        minTime: 200,
        reservoir: 10,
        reservoirRefreshAmount: 10,
        reservoirRefreshInterval: 60 * 1000,
      });

      const imageBuffers: Buffer[] = [];
      const imageSlideMap: number[] = [];

      // Fetch image URLs and buffers with limiter
      const _slides = await Promise.all(
        message?.slides?.map((slide: any, index: number) =>
          limiter.schedule(async () => {
            if (slide?.image) {
              const response = await this.aiAssistantService.generateImage(
                slide.image,
              );
              const imageUrl = response?.data[0]?.url;

              const imageResponse = await firstValueFrom(
                this.httpService.get(imageUrl, { responseType: 'arraybuffer' }),
              );
              const imageBuffer = Buffer.from(imageResponse.data);
              imageBuffers.push(imageBuffer);
              imageSlideMap.push(index);
            } else {
              slide.image = '';
            }
            return slide;
          }),
        ),
      );

      // Convert buffers to streams
      const streams = imageBuffers.map((buffer) => Readable.from(buffer));

      // Batch upload all images
      const uploadedImages = await this.awsS3Service.uploadImages(
        'slides-images',
        streams,
      );

      // Map secure URLs back to slides
      uploadedImages.forEach((uploaded, i) => {
        const index = imageSlideMap[i];
        _slides[index].image = uploaded.secure_url;
      });

      // Upload theme image if it exists
      let _theme = '';
      if (message?.theme) {
        const response = await this.aiAssistantService.generateImage(
          message.theme,
        );
        const imageUrl = response?.data[0]?.url;

        const imageResponse = await firstValueFrom(
          this.httpService.get(imageUrl, { responseType: 'arraybuffer' }),
        );
        const imageBuffer = Buffer.from(imageResponse.data);
        const stream = Readable.from(imageBuffer);

        const { secure_url } = await this.awsS3Service.uploadImage(
          'slides-images',
          stream,
        );
        _theme = secure_url;
      }

      return { _slides, _theme };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async generateSlideImage_v2(
    userUUID: string,
    message: PresImageInput[],
  ): Promise<string> {
    try {
      // Early return if no prompt
      if (!message.some((item) => item?.prompt)) {
        return 'No prompt provided. Nothing to generate.';
      }

      // Fire off background task (non-blocking)
      setImmediate(async () => {
        const limiter = new Bottleneck({
          maxConcurrent: 2,
          minTime: 200,
          reservoir: 10,
          reservoirRefreshAmount: 10,
          reservoirRefreshInterval: 60 * 1000,
        });

        const imageJobMap = new Map<number, Buffer>();

        await Promise.all(
          message.map((item, index) =>
            limiter.schedule(async () => {
              if (item?.prompt) {
                try {
                  const response = await this.aiAssistantService.generateImage(
                    item.prompt,
                  );
                  const imageUrl = response?.data[0]?.url;
                  const imageResponse = await firstValueFrom(
                    this.httpService.get(imageUrl, {
                      responseType: 'arraybuffer',
                    }),
                  );

                  const buffer = Buffer.from(imageResponse.data);
                  imageJobMap.set(index, buffer);
                } catch (err) {
                  console.warn(
                    `Image generation failed for index ${index}:`,
                    err.message,
                  );
                  message[index].image = '';
                }
              } else {
                message[index].image = '';
              }
            }),
          ),
        );

        const orderedIndices = Array.from(imageJobMap.keys());
        const streams = orderedIndices.map((i) =>
          Readable.from(imageJobMap.get(i)),
        );

        const uploadedImages = await this.awsS3Service.uploadImages(
          'slides-images',
          streams,
        );

        uploadedImages.forEach((uploaded, i) => {
          const originalIndex = orderedIndices[i];
          message[originalIndex].image = uploaded.secure_url;
        });

        // Emit event to user via WebSocket
        this.wsNotificationService.slideImageGenStatus(userUUID, {
          slides: message,
          message: 'Image generation completed successfully.',
        });
      });

      // Immediate response
      return 'Image generation started in the background. You will be notified once complete.';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async generateCoverSlideImage(
    message: PresImageInput[],
  ): Promise<string | undefined> {
    try {
      const limiter = new Bottleneck({
        maxConcurrent: 2,
        minTime: 200,
        reservoir: 10,
        reservoirRefreshAmount: 10,
        reservoirRefreshInterval: 60 * 1000,
      });

      const imageJobMap = new Map<number, Buffer>();

      await Promise.all(
        message.map((item, index) =>
          limiter.schedule(async () => {
            if (item?.prompt) {
              try {
                const response = await this.aiAssistantService.generateImage(
                  item.prompt,
                );
                const imageUrl = response?.data?.[0]?.url;

                if (imageUrl) {
                  const imageResponse = await firstValueFrom(
                    this.httpService.get(imageUrl, {
                      responseType: 'arraybuffer',
                    }),
                  );
                  const buffer = Buffer.from(imageResponse.data);
                  imageJobMap.set(index, buffer);
                } else {
                  message[index].image = '';
                }
              } catch (err) {
                console.warn(
                  `Image generation failed for index ${index}:`,
                  err.message,
                );
                message[index].image = '';
              }
            } else {
              message[index].image = '';
            }
          }),
        ),
      );

      const orderedIndices = Array.from(imageJobMap.keys());
      const streams = orderedIndices.map((i) =>
        Readable.from(imageJobMap.get(i)),
      );

      const uploadedImages = await this.awsS3Service.uploadImages(
        'slides-images',
        streams,
      );

      uploadedImages.forEach((uploaded, i) => {
        const originalIndex = orderedIndices[i];
        message[originalIndex].image = uploaded.secure_url;
      });

      return uploadedImages[0]?.secure_url;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async generatePresQuiz(user: UserDocument, payload: QuizPromptInput) {
    try {
      const { prompt, ...rest } = payload;
      const getQuestions = await this.quizAIService.generateAIquiz(user, {
        ...rest,
        prompt:
          'Based on the presentation content, please create a quiz for the audience',
      });

      if (!getQuestions?.questions?.length)
        throw new BadRequestException('System busy. Please try again later.');

      if (getQuestions?.questions?.length > 0) {
        return getQuestions?.questions?.map((question) => {
          return {
            ...question,
            presQuestionUUID: this.uiQuiz.rnd(),
          };
        });
      }

      // return getQuestions?.questions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async generatePresQuiz_v2(
    user: UserDocument,
    payload: QuizPromptInput,
  ): Promise<QuizAIRes> {
    const { threadId, type, prompt, title } = payload;
    let newPrompt = '';

    if (!threadId) {
      const tempPrompt = `Strictly ensure to generate the ${type?.toLowerCase()} based on the presentation title: ${title}\n`;
      newPrompt = tempPrompt + prompt;
    }

    const newPayload = {
      ...payload,
      prompt:
        newPrompt ||
        'Based on the presentation content, please create a quiz for the audience',
    };

    try {
      let getQuestions;
      if (type === QuizOrPollType.QUIZ) {
        getQuestions = await this.quizAIService.generateAIquiz(user, {
          threadId,
          ...newPayload,
        });
      } else if (type === QuizOrPollType.POLL) {
        getQuestions = await this.quizAIService.generateAIPoll(user, {
          threadId,
          ...newPayload,
        });
      }

      if (!getQuestions?.questions?.length)
        throw new BadRequestException('System busy. Please try again later.');

      if (getQuestions?.questions?.length > 0) {
        const questions = getQuestions?.questions?.map((question) => {
          return {
            ...question,
            presQuestionUUID: this.uiQuiz.rnd(),
          };
        });
        return {
          threadId: getQuestions?.threadId,
          questions,
        };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  // Get prompt for assistant AI
  getPrompt(
    configPresInput: ConfigPresInput,
    firstName: string,
    lastName: string,
    files?: FileUpload[],
    userTtitle?: string, //Dr, Prof, etc
    userImage?: string, //image url
  ): string {
    const {
      title,
      audience,
      goals,
      noOfSlide,
      presPromptType,
      theme,
      subtitle,
    } = configPresInput;

    const slideNo = noOfSlide || 14;

    let prompt: string;
    const presenter = `${firstName} ${lastName}`;

    switch (presPromptType) {
      case PresPromptType.PRESENTATION_OUTLINE:
        const filePrompt =
          files?.length > 0
            ? 'by using the information provided in the uploaded files'
            : '';

        prompt = `Create a presentation outline titled "${title}" ${filePrompt}. The subtitle will be "${subtitle}". The target audience consists of ${audience}. The goals of the presentation are: ${goals}. The outline should include an introduction, key points, and a conclusion that aligns with the goals and engages the audience.
        Ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
            {
              "description": "A brief description of the prompt",
              "content": "String containing a well formated content of the outline creatively formated using Markdown"
            }`;
        break;

      case PresPromptType.PRESENTATION_NOTE:
        prompt = `From the provided outline, please develop a detailed long-form article on the subject. The article should expand on each point in the outline, providing in-depth information, examples, and citations where appropriate. Ensure that the content is well-structured and informative, suitable for the intended audience. Please ensure that all double quotes within the content are escaped with a backslash (\\) to preserve JSON validity. Newlines should be represented as \\n.
        Ensure that you return the output strictly in valid JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
            {
              "description": "A brief description of the prompt",
              "content": "String containing a well-formatted content of the article creatively formated using Markdown"
            }`;
        break;

      case PresPromptType.PRESENTATION_SLIDE:
        prompt = `Based on the article provided, please create a set of presentation slides. Each slide should highlight the key points from each section of the outline.
            Ensure that:
            - Each slide focuses on one section of the outline, using concise bullet points and highlights.
            - Include graphs or statistical data on slides where applicable to visually support or illustrate key points.
            - On the image, only provide image description when necessary for illustration, to summarize data or visually articulate the points or story being made. Please avoid image descriptions that contain text that is not allowed by the OpenAI safety system, which may lead to rejection of the request.
            - The conclusion slide summarizes the key takeaways and invites audience engagement.
            - The number of slides is ${slideNo}.
            - Strictly ensure to add citations to the slides when necessary.
            - The last slide (slide ${
              slideNo - 1
            }) must be the references slide.

            **IMPORTANT:** The first slide (slide0) should be a **cover slide** and must follow this format, returned inside a **valid Markdown string**:

            - Stringly ensure to use the following format for the title and subtitle:
                       
                  ## {Title}

                  ### {Subtitle}

                  **{firstName} {lastName}**  
                  _{userTitle}_

        - Strictly ensure slide0 is in markdown format and not html
        Ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
        {
        "slides": [
              {
                "slide0": "## {Title}

                  ### {Subtitle}

                  **{firstName} {lastName}**  
                  _{userTitle}_",
"
                "image": "Provide a cover image description for the presentation when necessary for illustration, to summarize data or visually articulate the points or story being made. Please avoid image descriptions that contain text that is not allowed by the OpenAI safety system, which may lead to rejection of the request."
              },
            ...
            {
              "slide${
                slideNo - 1
              }": "String containing a structured breakdown of the conclusion slide creatively formated using Markdown",
              "image": "Only provide image description when necessary for illustration, to summarize data or visually articulate the points or story being made. Please avoid image descriptions that contain text that is not allowed by the OpenAI safety system, which may lead to rejection of the request.",
            }
          ]`;
        // Add theme description only if theme is null
        if (!theme) {
          prompt += `,
          "theme": "Please select a visually appealing background that complements the presentation topic and provide a brief description of the chosen theme."
        }`;
        }
        break;

      case PresPromptType.PRESENTATION_SCRIPT:
        prompt = `Based on the slides provided, please create a detailed presentation script. The script should match each slide and include:
            - An opening introduction that sets the context and purpose of the presentation.
            - A detailed narration for each slide that elaborates on the key points highlighted, using a professional and engaging tone.
            - A conclusion script that summarizes the main points and encourages audience interaction or questions.
            - The script should be creatively formated using Markdown.
           Ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
           {
        "script": [
            {
              "slide0": "String containing a structured breakdown of the title slide with a title, brief introduction and presenter name: ${presenter}",
            },
            {
              "slide1": "String containing a structured breakdown of the first section",
            },
            ...
            {
              "slide${
                slideNo - 1
              }": "String containing a structured breakdown of the conclusion slide",
            }
          ]`;
        break;

      default:
        prompt = 'Invalid presentation prompt type';
        break;
    }

    prompt += `\n Strictly ensure that the top level heading is ## and not #. while using ##, use ### for the subheadings`;
    return prompt;
  }

  // Get quiz, poll or q and a from the slide
  async getEngagement_v2(
    preview: PreviewInp[],
    presId: ObjectId,
    questionType?: string,
  ) {
    try {
      const answeredQuestions: GameDocument = await this.gameModel
        .findOne({
          presId: presId,
        })
        .exec();

      const filteredPreview = preview.filter((prev) => {
        if (prev?.questions?.length && !prev?.questionType) {
          throw new BadRequestException(
            `Slide preview with ID ${prev?.id} has questions but no questionType`,
          );
        }

        if (questionType) {
          return prev?.questionType === questionType;
        }

        return [EngageType.POLL, EngageType.QUIZ].includes(prev?.questionType);
      });

      const filteredQuestions = filteredPreview.map((prev) => {
        return prev?.questions?.filter((question) => {
          return !answeredQuestions?.questionUUIDs?.some((answered) =>
            question.options.includes(answered),
          );
        });
      });
      if (filteredQuestions?.length > 0) {
        return filteredQuestions[0];
      }

      return [];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  getEngagement(preview: PreviewInp[], questionType?: string) {
    try {
      return preview.filter((prev) => {
        if (prev?.questions?.length && !prev?.questionType) {
          throw new BadRequestException(
            `Slide preview with ID ${prev?.id} has questions but no questionType`,
          );
        }

        if (questionType) {
          return prev?.questionType === questionType;
        }

        return [EngageType.POLL, EngageType.QUIZ].includes(prev?.questionType);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete all user presentation
  async deleteAllUserPres(userId: ObjectId) {
    try {
      const pres = await this.presentationModel.deleteMany({ userId });

      return {
        count: pres.deletedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
