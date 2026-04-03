import { Module } from '@nestjs/common';
import { RedirctController } from './redirect.controller';
import { UrlsModule } from 'src/urls/urls.module';

@Module({
    imports: [
        UrlsModule,
    ],
    controllers: [RedirctController],
    providers: [],
})
export class RedirectModule { }
