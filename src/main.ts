import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { join } from 'node:path';
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
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
  app.set('trust proxy', true)


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