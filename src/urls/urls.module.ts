import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { AdminUrlsController, UrlsController } from './urls.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Url, UrlSchema } from './schemas/url.schema';
import { ClicksModule } from 'src/clicks/clicks.module';

@Module({
  controllers: [UrlsController, AdminUrlsController],
  providers: [UrlsService],
  imports: [
    ClicksModule,
    MongooseModule.forFeature([{ name: Url.name, schema: UrlSchema }]),
  ],
  exports: [UrlsService],

})
export class UrlsModule { }
