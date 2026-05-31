import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AuthGuard } from "src/auth/guard/auth.guard";
import { Roles } from "src/auth/decorator/roles.decorator";
import { Role } from "src/auth/enum/role.enum";

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get()
    @UseGuards(AuthGuard)
    async findAll(@Request() req) {
        const owner_id = req.user.sub
        return await this.analyticsService.getAnalytics(owner_id);
    }

    @Get("/stats")
    @UseGuards(AuthGuard)
    @Roles(Role.Admin)
    async getStats() {

        return await this.analyticsService.getStats()
    }

}
