import { Module } from '@nestjs/common';
import { ClicksModule } from 'src/clicks/clicks.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { UserModule } from 'src/user/user.module';
import { UrlsModule } from 'src/urls/urls.module';

@Module({
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    imports: [ClicksModule, UserModule, UrlsModule]
})
export class AnalyticsModule { }
