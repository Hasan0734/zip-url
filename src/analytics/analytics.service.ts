import { UrlsService } from 'src/urls/urls.service';
import { ClicksService } from 'src/clicks/clicks.service';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AnalyticsService {

    constructor(private clicksService: ClicksService, private userService: UserService, private urlsService: UrlsService) { }

    async getAnalytics(owner_id?: Types.ObjectId) {

        try {
            const [topCountries, devices, WeeklyData, last7DaysAgo, last30Days] = await Promise.all([
                this.clicksService.getToCountries(owner_id),
                this.clicksService.getAllDevices(owner_id),
                this.clicksService.getAllUrlWeekData(owner_id),
                this.clicksService.last7DaysAgo(owner_id),
                this.clicksService.last30Days(owner_id)

            ])
            return { topCountries, devices, ...WeeklyData, last7DaysAgo, last30Days }
        } catch (error) {
            throw error;
        }
    }

    async getStats() {
        try {
            const [urlStats, userStats] = await Promise.all([
                this.urlsService.getStatsByAdmin(),
                this.userService.getUsersStats()
            ])

            return {
                ...urlStats,
                totalUser: userStats.totalUsers
            }
        } catch (error) {
            throw error;
        }
    }

    async getClicksAnalytics() {
        const [last90DaysDevices, last29DaysDevices, last6DaysDevices] = await Promise.all([
            this.clicksService.getDevicesData(90),
            this.clicksService.getDevicesData(29),
            this.clicksService.getDevicesData(6),
        ])

        return { last90DaysDevices, last29DaysDevices, last6DaysDevices }
    }
    async getUsersAnalytics() {
        const [last90DaysUsers, last30DaysUsers, last6DaysUsers] = await Promise.all([
            this.userService.getAnalytics(90),
            this.userService.getAnalytics(30),
            this.userService.getAnalytics(7),
        ])
        return { last90DaysUsers, last30DaysUsers, last6DaysUsers }
    }
}   
