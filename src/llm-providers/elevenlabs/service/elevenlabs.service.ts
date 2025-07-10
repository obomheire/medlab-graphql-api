import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { SpeechAIService } from 'src/llm-providers/openAI/service/ai.speech.service';
import { streamToBuffer } from 'src/utilities/service/helpers.service';
import { Readable } from 'stream';

@Injectable()
export class ElevenLabsService {
  private client: ElevenLabsClient;

  constructor(
    private readonly speechAIservice: SpeechAIService,
    private configService: ConfigService,
  ) {
    this.client = new ElevenLabsClient({
      apiKey: this.configService.get<string>('11LABS_API_KEY'),
    });
  }

  // Create text to speech
  async createTextToSpeech(text: string, voiceId: string): Promise<Buffer> {
    try {
      const response = await this.client.textToSpeech.convert(voiceId, {
        outputFormat: 'mp3_44100_128',
        text,
        modelId: 'eleven_multilingual_v2',
      });

      // Convert stream to buffer
      const fileBuffer = await streamToBuffer(response);

      // // Save final podcast audio
      // await this.speechAIservice.saveAudioToFile(fileBuffer, 'podcast');

      return fileBuffer;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
