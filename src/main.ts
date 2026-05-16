import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { join } from 'node:path';
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    stopAtFirstError: true,
    transform: true
    // exceptionFactory: (errors:any) => {
    //   const result = errors.map((error) => ({
    //     property: error.property,
    //     message: Object.values(error.constraints)[0],
    //   }));
    //   return new BadRequestException(result);
    // },
  }))

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs')
  // app.setLocal('view options', { layout: 'layouts/main' }); 

  // hbs.registerPartials(join(__dirname, '..', 'views/partials'))


  app.set('trust proxy', true)

  app.enableCors({
    origin: process.env.APP_URL,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
  // app.setGlobalPrefix('api')

  app.use(cookieParser())
  const config = new DocumentBuilder()
    .setTitle('Zip Url')
    .setDescription('The Zip Url API description')
    .setVersion('1.0')
    .addTag('zip-url')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();