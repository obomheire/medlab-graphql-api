import { Injectable } from '@nestjs/common';
import { AppRes } from './app.types';

@Injectable()
export class AppService {
  getHello(): AppRes {
    return { message: 'Hello from Medscroll API!', status: 'Running' };
  }
}
