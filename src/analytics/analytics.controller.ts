import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AuthGuard } from "src/auth/guard/auth.guard";
import { Roles } from "src/auth/decorator/roles.decorator";
import { Role } from "src/auth/enum/role.enum";

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get()
    @UseGuards(AuthGuard)
    async getAnalytics(@Req() req) {
        const owner_id = req.user.sub
        // if (req.user.role === 'admin') {
        //     return await this.analyticsService.getAnalytics();

        // }
        return await this.analyticsService.getAnalytics(owner_id);
    }

    @Get("/stats")
    @UseGuards(AuthGuard)
    @Roles(Role.Admin)
    async getStats() {
        return await this.analyticsService.getStats()
    }


    @Get("/clicks")
    @UseGuards(AuthGuard)
    @Roles(Role.Admin)
    async getClicksAnalytics() {
        return await this.analyticsService.getClicksAnalytics()
    }

    @Get("/users")
    @UseGuards(AuthGuard)
    @Roles(Role.Admin)
    async getUsersAnalytics() {
        return await this.analyticsService.getUsersAnalytics()
    }
    @Get("/urls")
    @UseGuards(AuthGuard)
    @Roles(Role.Admin)
    async getUrlsAnalytics() {
        return await this.analyticsService.getUrlsAnalytics()
    }
}
