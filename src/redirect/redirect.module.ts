import { Module } from '@nestjs/common';
import { RedirctController } from './redirect.controller';
import { UrlsModule } from 'src/urls/urls.module';
import { ClicksModule } from 'src/clicks/clicks.module';

@Module({
    imports: [
        UrlsModule,
        ClicksModule
    ],
    controllers: [RedirctController],
    providers: [],
})
export class RedirectModule { }
