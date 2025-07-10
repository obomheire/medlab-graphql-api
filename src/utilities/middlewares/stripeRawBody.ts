import { Response } from 'express';
import { json } from 'body-parser';
import { ReqWithRawBody } from '../interface/interface';

export const StripeRawBodyMiddleware = () =>
  json({
    verify: (req: ReqWithRawBody, res: Response, buffer: Buffer) => {
      if (
        req.url === '/stripe/webhook/construct-event' &&
        Buffer.isBuffer(buffer)
      ) {
        req.rawBody = Buffer.from(buffer);
      }
      return true;
    },
  });
