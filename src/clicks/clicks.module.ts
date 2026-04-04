import { forwardRef, Module } from '@nestjs/common';
import { ClicksService } from './clicks.service';
import { ClicksController } from './clicks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Click, ClickSchema } from './schemas/click.schema';
import { UrlsModule } from 'src/urls/urls.module';


@Module({
  controllers: [ClicksController],
  providers: [ClicksService],
  imports: [
    MongooseModule.forFeature([{ name: Click.name, schema: ClickSchema }]),
    forwardRef(() => UrlsModule)
  ],
  exports: [ClicksService]
})
export class ClicksModule { }
