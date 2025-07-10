import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { CustomValidationPipe } from './utilities/custom/custom.pipe';
import { StripeRawBodyMiddleware } from './utilities/middlewares/stripeRawBody';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(StripeRawBodyMiddleware());
  app.enableCors({
    origin: '*',
    // credentials: true,
    // all headers that client are allowed to use
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'apollo-require-preflight',
      'apikey',
      'apihost',
    ],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  });
  app.use(
    '/graphql',
    graphqlUploadExpress({
      maxFileSize: 100000000, // 10 MB
      maxFiles: 10, // 10 images max
      overrideSendResponse: false,
    }),
  );
  app.useGlobalPipes(new CustomValidationPipe());
  const port = process.env.PORT || 7000;
  await app.listen(port);
}
bootstrap();
