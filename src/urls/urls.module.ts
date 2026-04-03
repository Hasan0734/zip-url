import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { UrlsController } from './urls.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Url, UrlSchema } from './schemas/url.schema';

@Module({
  controllers: [UrlsController],
  providers: [UrlsService],
  imports: [MongooseModule.forFeature([{ name: Url.name, schema: UrlSchema }])],
  exports: [UrlsService],

})
export class UrlsModule { }
