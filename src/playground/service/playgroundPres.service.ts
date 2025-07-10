import { BadRequestException, Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { isValidJSON } from 'src/utilities/service/helpers.service';
import { AIasistantService } from 'src/llm-providers/openAI/service/ai.assistant.service';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';
import { QuizAIService } from 'src/llm-providers/openAI/service/ai.quiz.service';
import { UserDocument } from 'src/user/entity/user.entity';
import { ComponentType } from 'src/llm-providers/openAI/enum/assistantAI.enum';
import ShortUniqueId from 'short-unique-id';
import { EngageType } from 'src/quiz/enum/quiz.enum';
import { GameDocument, GameEntity } from 'src/quiz/entity/game.entity';
import { QuizPromptInput } from 'src/llm-providers/openAI/dto/quizAI.input';
import { QuizAIRes } from 'src/llm-providers/openAI/types/ai.type';
import Bottleneck from 'bottleneck';
import { AwsS3Service } from 'src/files/service/aws-s3.service';
import { Readable } from 'stream';
import { async, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { WsNotificationService } from 'src/ws/service/ws.notification.service';
import {
  PlaygroundPresentationDocument,
  PlaygroundPresentationEntity,
} from '../entity/presentation.playground.entity';
import {
  ConfigPresInput,
  PresInput,
  UpdatePresInput,
  PresImageInput,
  PreviewInp,
} from 'src/presentation/dto/presentation.input';
import { PresentationDocument } from 'src/presentation/entity/presentation.entity';
import {
  PresPromptType,
  QuizOrPollType,
} from 'src/presentation/enum/presentation.enum';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/service/user.service';
import { PlaygroundSlideUploadRes } from '../types/playground.slide.types';
import {
  PlaygroundPresInput,
  PlaygroundPresSettingsInput,
} from '../dto/playgroundPres.category.dto';

@Injectable()
export class PlaygroundPresentationService {
  private readonly uid = new ShortUniqueId({ length: 6 });
  private readonly uiQuiz = new ShortUniqueId({ length: 16 });

  constructor(
    @InjectModel(PlaygroundPresentationEntity.name)
    private readonly presentationModel: Model<PlaygroundPresentationDocument>,
    @InjectModel(GameEntity.name)
    private readonly gameModel: Model<GameEntity>,
    private readonly awsS3Service: AwsS3Service,
    private readonly aiAssistantService: AIasistantService,
    private readonly asstThreadService: AsstThreadService,
    private readonly quizAIService: QuizAIService,
    private readonly httpService: HttpService,
    private readonly wsNotificationService: WsNotificationService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  // Configure presentation
  async configPlaygroundPresentation(
    configPresInput: ConfigPresInput,
    outline?: FileUpload,
    additionalInfo?: FileUpload,
  ) {
    try {
      const {
        threadId,
        presPromptType,
        theme: background,
        outline: markdownOutline,
      } = configPresInput;

      if (presPromptType === PresPromptType.PRESENTATION_OUTLINE) {
        if (!outline && !markdownOutline) {
          throw new BadRequestException(
            'Outline is required! You can provide either by uploading an outline or by providing a markdown outline',
          );
        }
      }

      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );

      const user = await this.userService.getUserByObjectId(medScrollId);
      let outlineContent: any;
      let outlineThreadId: string;
      let message: any;
      let response: any;

      const { firstName, lastName, _id: userId } = user;

      if (outline && presPromptType === PresPromptType.PRESENTATION_OUTLINE) {
        const result = await this.asstThreadService.addMessage(
          user,
          {
            threadId,
            message: this.promptToConvertOutlineToMarkdown(),
          },
          ComponentType.SLIDE_PRESENTATION,
          '',
          [outline],
          'playground-slide-presentation-files',
        );

        if (isValidJSON(result?.message)) {
          outlineContent = JSON.parse(result?.message);
          outlineThreadId = result?.threadId;
        }
      }
      if (presPromptType !== PresPromptType.PRESENTATION_OUTLINE) {
        response = await this.asstThreadService.addMessage(
          user,
          {
            threadId,
            message: this.getPrompt(
              configPresInput,
              firstName,
              lastName,
              additionalInfo ? [additionalInfo] : [],
              user?.specialty,
              user?.profileImage,
            ),
          },
          ComponentType.SLIDE_PRESENTATION,
          '',
          additionalInfo ? [additionalInfo] : [],
          'playground-slide-presentation-files',
        );

        if (!isValidJSON(response?.message)) {
          message = await this.asstThreadService.getValidateJSON(
            response?.message,
          );
        } else {
          message = JSON.parse(response?.message);
        }
      }

      let slides: any;
      let theme: string;
      // Extract content and update message field
      return {
        ...(response || outlineContent),
        threadId: outlineThreadId || response?.threadId,
        message: message?.content || outlineContent?.content || markdownOutline,
        slides: message?.slides,
        script: message?.script,
        theme: background || theme,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async uploadSlidePresentation(
    slideImages?: FileUpload[], // The slides images name should be slide(N).ext where N is the slide number
    embedLink?: string,
  ): Promise<PlaygroundSlideUploadRes> {
    try {
      let uploadedSlidesUrl: string[] = [];

      if (embedLink && slideImages?.length) {
        throw new BadRequestException(
          'Cannot provide both embed link and slide images',
        );
      }

      if (slideImages?.length) {
        // Sort by extracted slide number (from "slide(N).ext")
        const sortedSlides = await Promise.all(
          slideImages.map(async (slide) => {
            const resolved = await slide;
            const fileName = resolved.filename;
            const match = fileName.match(/slide\((\d+)\)/i);
            const order = match
              ? parseInt(match[1], 10)
              : Number.MAX_SAFE_INTEGER;
            return { ...resolved, order };
          }),
        );

        sortedSlides.sort((a, b) => a.order - b.order);

        // Create streams in sorted order
        const slideStreams = await Promise.all(
          sortedSlides.map(async (slide) => {
            const stream = slide.createReadStream();
            return stream;
          }),
        );

        const uploadedImages = await this.awsS3Service.uploadImages(
          'playground-slides-images',
          slideStreams,
        );

        uploadedSlidesUrl = uploadedImages.map((img) => img.secure_url);
      }

      return {
        slides: uploadedSlidesUrl,
        embedLink,
        isUpload: uploadedSlidesUrl.length > 0,
        isEmbed: !!embedLink,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  
  async createPlaygroundPres(
    presInput: PlaygroundPresInput,
  ): Promise<PlaygroundPresentationDocument> {
    try {
      const baseTitle = presInput.title;

      const medScrollId = new ObjectId(
        this.configService.get<string>('MEDSCROLL_ID'),
      );

      const user = await this.userService.getUserByObjectId(medScrollId);

      const { _id: userId } = user;

      // Find all titles that match base or base (n)
      const regex = new RegExp(`^${baseTitle}( \\((\\d+)\\))?$`, 'i');
      const existingPres = await this.presentationModel.find({
        title: regex,
        // userId,
      });

      if (existingPres?.length) {
        // Extract numbers in parentheses and find the max
        const maxSuffix = existingPres?.reduce((max, doc) => {
          const match = doc?.title?.match(/\((\d+)\)$/);
          const num = match ? parseInt(match[1], 10) : 0;
          return Math.max(max, num);
        }, 0);

        presInput.title = `${baseTitle} (${maxSuffix + 1})`;
      }

      const document = new this.presentationModel({
        ...presInput,
        isMedScroll: true,
        // userId,
      });

      return await document.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updatePresSettings(
    presUUID: string,
    settings: PlaygroundPresSettingsInput,
  ): Promise<string> {
    try {
      await this.presentationModel.findOneAndUpdate({ presUUID }, settings, {
        new: true,
      });
      return 'Presentation settings updated successfully';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all playground presentations that are published
  async getPlaygroundPresentations(): Promise<
    PlaygroundPresentationDocument[]
  > {
    try {
      const foundPres = await this.presentationModel.find({
        isMedScroll: true,
        isDraft: false,
        isPublished: true,
        inReview: false,
      });
      return foundPres;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all playground presentations that are unpublished
  async getUnpublishedPlaygroundPresentations(): Promise<
    PlaygroundPresentationDocument[]
  > {
    try {
      const foundPres = await this.presentationModel.find({
        isMedScroll: true,
        isDraft: false,
        isPublished: false,
        inReview: false,
      });
      return foundPres;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  // Get all playground presentations that are published
  async getInReviewPlaygroundPresentations(): Promise<
    PlaygroundPresentationDocument[]
  > {
    try {
      const foundPres = await this.presentationModel.find({
        isMedScroll: true,
        isDraft: false,
        isPublished: false,
        inReview: true,
        isBulk: true,
      });
      return foundPres;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all playground presentations that are drafts
  async getPlaygroundPresDrafts(): Promise<PlaygroundPresentationDocument[]> {
    try {
      const foundPres = await this.presentationModel.find({
        isMedScroll: true,
        isDraft: true,
      });
      return foundPres;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getPresByUUID(
    presUUID: string,
  ): Promise<PlaygroundPresentationDocument> {
    try {
      const foundPres = await this.presentationModel.findOne({ presUUID });
      if (!foundPres)
        throw new BadRequestException(
          'Presentation not found with UUID: ' + presUUID,
        );
      return foundPres;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Update presentation
  async updatePlaygroundPres(
    updatePresInput: UpdatePresInput,
  ): Promise<PlaygroundPresentationDocument> {
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
          // userId: existingPres.userId,
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

  async generateSlideImage(
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

  async generatePresQuizOrPoll(payload: QuizPromptInput): Promise<QuizAIRes> {
    const { threadId, type, prompt, title } = payload;

    const medScrollId = new ObjectId(
      this.configService.get<string>('MEDSCROLL_ID'),
    );

    const user = await this.userService.getUserByObjectId(medScrollId);
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
      threadId,
    } = configPresInput;

    const slideNo = noOfSlide || 14;

    let prompt: string;
    const presenter = `${firstName} ${lastName}`;

    if (!threadId && presPromptType !== PresPromptType.PRESENTATION_OUTLINE) {
      prompt = `Strictly ensure to generate the content based on the presentation title: ${title}\n`;
    }

    const filePrompt =
      files?.length > 0
        ? 'by using the additional information provided in the uploaded files'
        : '';

    switch (presPromptType) {
      case PresPromptType.PRESENTATION_OUTLINE:
        prompt += `Create a presentation outline titled "${title}" ${filePrompt}. The subtitle will be "${subtitle}" if provided. The target audience consists of ${audience}. The goals of the presentation are: ${goals}. The outline should include an introduction, key points, and a conclusion that aligns with the goals and engages the audience.
        Ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
            {
              "description": "A brief description of the prompt",
              "content": "String containing a well formated content of the outline creatively formated using Markdown"
            }`;
        break;

      case PresPromptType.PRESENTATION_NOTE:
        prompt += `From the following provided outline and ${filePrompt}, please develop a detailed long-form article on the subject. The article should expand on each point in the outline, providing in-depth information, examples, and citations where appropriate. Ensure that the content is well-structured and informative, suitable for the intended audience. Please ensure that all double quotes within the content are escaped with a backslash (\\) to preserve JSON validity. Newlines should be represented as \\n.
        Ensure that you return the output strictly in valid JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
            {
              "description": "A brief description of the prompt",
              "content": "String containing a well-formatted content of the article creatively formated using Markdown"
            }`;
        break;

      case PresPromptType.PRESENTATION_SLIDE:
        prompt += `Based on the article provided and ${filePrompt}, please create a set of presentation slides. Each slide should highlight the key points from each section of the outline.
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

            # <strong>{Title}</strong><br>
            ## {Subtitle}<br>

            <div style="display: flex; align-items: center; margin-top: 40px;"><br>
              ${
                userImage
                  ? `<img
                src='${userImage}'
                alt='${firstName?.slice(0, 1).toUpperCase()}'
                style='width: 80px; height: 80px; border-radius: 50%; margin-right: 15px;'
              />`
                  : `<div style='width: 80px; height: 80px; border-radius: 50%; margin-right: 15px; background-color: #143B82; color: #FFFFFF; display: flex; align-items: center; justify-content: center;'>
                ${firstName?.slice(0, 1).toUpperCase()} ${lastName
                      ?.slice(0, 1)
                      .toUpperCase()}
                </div>`
              }
              <div>
                <strong>${firstName} ${lastName}</strong><br />
                ${userTtitle || ''}
              </div>
            </div>

        Do not escape or modify the HTML or Markdown formatting above. and ensure that the above is only used for the first slide which is slide0.
        -Strictly ensure that for every html tag that needs to enter the next line, you must escape the html tags using <br> and not the \n. For example, <div> should be written as <div><br> and not <div>\n
        Ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
        {
        "slides": [
              {
                "slide0": "# <strong>{Title}</strong><br>## {Subtitle}<br><div style="display: flex; align-items: center; margin-top: 40px;"><br> ${
                  userImage
                    ? `<img src='${userImage}' alt='${firstName
                        ?.slice(0, 1)
                        .toUpperCase()}' style='width: 80px; height: 80px; border-radius: 50%; margin-right: 15px;'/>`
                    : `<div style='width: 80px; height: 80px; border-radius: 50%; margin-right: 15px; background-color: #143B82; color: #FFFFFF; display: flex; align-items: center; justify-content: center;' ${firstName
                        ?.slice(0, 1)
                        .toUpperCase()} ${lastName
                        ?.slice(0, 1)
                        .toUpperCase()}</div>`
                }<div><strong>${firstName} ${lastName}</strong><br />${
          userTtitle || ''
        }</div></div>
                "image": ""
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
        prompt += `Based on the slides provided and ${filePrompt}, please create a detailed presentation script. The script should match each slide and include:
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
    if (configPresInput.additionalPrompt)
      prompt += `\n\n${configPresInput.additionalPrompt}`;
    prompt += `\n Strictly ensure that the top level heading is ## and not #. while using ##, use ### for the subheadings`;

    return prompt;
  }

  promptToConvertOutlineToMarkdown() {
    return `Strictly convert the uploaded outline into markdown format.
    - Strictly ensure that the top level heading is ## and not #. while using ##, use ### for the subheadings
    - Ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
    {
      "description": "A brief description of the prompt",
      "content": "String containing a well-formatted content of the article creatively formated using Markdown and maintaining the original outline structure of the uploaded file"
    }`;
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
}
