import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = crypto.randomBytes(32);
  private readonly iv = crypto.randomBytes(16);
  private readonly cryptoSecretKey =
    this.configService.get<string>('CRYPTO_SECRET_KEY');
  private readonly cryptoSecretIv =
    this.configService.get<string>('CRYPTO_SECRET_IV');

  constructor(private configService: ConfigService) {}

  encrypt(text: string): string {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.key),
      this.iv,
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${this.iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.key),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  encryptAnswer(text: string): any {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.cryptoSecretKey, 'hex'),
      Buffer.from(this.cryptoSecretIv, 'hex'),
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
  }

  decryptAnswer(text: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.cryptoSecretKey, 'hex'),
      Buffer.from(this.cryptoSecretIv, 'hex'),
    );
    let decrypted = decipher.update(Buffer.from(text, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();

    //NB:
    // if you use  const encrypt = JSON.stringify(object); return encryptAnswer(encrypt),
    // use const decrypt = decryptAnswer(string): return JSON.parse(decrypt)
  }

  // // To decrypt with crypto-js in react app (import CryptoJS from 'crypto-js';)
  // decryptAnswerInReactApp(encryptedText: string) {
  //   const key = CryptoJS.enc.Hex.parse(this.secretKey);
  //   const iv = CryptoJS.enc.Hex.parse(this.secretIv);

  //   const decrypted = CryptoJS.AES.decrypt(
  //     { ciphertext: CryptoJS.enc.Hex.parse(encryptedText) },
  //     key,
  //     { iv },
  //   );

  //   console.log(decrypted.toString(CryptoJS.enc.Utf8));
  // }
}
