import { ClicksService } from 'src/clicks/clicks.service';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class AnalyticsService {

    constructor(private clicksService: ClicksService) { }

    async getAnalytics(owner_id: Types.ObjectId) {

        try {
            const [topCountries, device, WeeklyData, last7DaysAgo, last30Days] = await Promise.all([
                await this.clicksService.getToCountries(owner_id),
                await this.clicksService.getAllDevices(owner_id),
                await this.clicksService.getAllUrlWeekData(owner_id),
                await this.clicksService.last7DaysAgo(owner_id),
                await this.clicksService.last30Days(owner_id)

            ])
            return { topCountries, device, ...WeeklyData, last7DaysAgo, last30Days }
        } catch (error) {
            throw error;
        }
    }
}
