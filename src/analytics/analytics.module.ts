import { Module } from '@nestjs/common';
import { ClicksModule } from 'src/clicks/clicks.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    imports: [ClicksModule]
})
export class AnalyticsModule { }
