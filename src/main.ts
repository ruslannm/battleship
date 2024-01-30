import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { resolve } from 'path';
import * as exphbs from 'express-handlebars';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableShutdownHooks();
  app.useStaticAssets(resolve('static'));
  app.setBaseViewsDir(resolve('views'));
  app.engine(
    'hbs',
    exphbs.engine({
      layoutsDir: resolve('views', 'layouts'),
      partialsDir: resolve('views', 'partials'),
      defaultLayout: 'layout',
      extname: 'hbs',
    }),
  );
  app.setViewEngine('hbs');
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
