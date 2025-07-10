import { BadRequestException, Injectable } from '@nestjs/common';
import * as textToSpeech from '@google-cloud/text-to-speech';
import * as path from 'path';
import * as fs from 'fs';
import { GenderType } from '../enum/assistantAI.enum';

@Injectable()
export class SpeechAIService {
  private client: textToSpeech.TextToSpeechClient;
  private readonly outputDir = path.join(process.cwd(), 'textToSpeech');
  private readonly keyFilePath = path.join(
    process.cwd(),
    'google-api',
    'google-medscroll-ai.json',
  );

  constructor() {
    this.client = new textToSpeech.TextToSpeechClient({
      keyFilename: this.keyFilePath,
    });
  }

  // Text To Speech
  async synthesizeSpeech(text: string, gender = GenderType.FEMALE) {
    try {
      const request: textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest =
        {
          input: { text },
          voice: {
            languageCode: 'en-AU', // English (Australia)
            name:
              gender === GenderType.MALE
                ? 'en-AU-Standard-D'
                : 'en-AU-Standard-C',
            ssmlGender: gender,
          },
          audioConfig: { audioEncoding: 'MP3' },
        };

      const [response] = await this.client.synthesizeSpeech(request);

      if (!response.audioContent) {
        throw new BadRequestException('No audio content received');
      }

      // // save audio to file
      // await this.saveAudioToFile(response.audioContent as Buffer);

      return Buffer.from(response.audioContent);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // save audio to file
  async saveAudioToFile(audioContent: Buffer, name?: string) {
    // Ensure the output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const fileName = `${name}.mp3` || 'speech.mp3';

    const filePath = path.join(this.outputDir, fileName);
    fs.writeFileSync(filePath, audioContent as Buffer);
  }
}
