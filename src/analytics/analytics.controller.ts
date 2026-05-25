import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AuthGuard } from "src/auth/guard/auth.guard";

@Controller('analytics')
export class ClicksController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    // @Get()
    // @UseGuards(AuthGuard)
    // findAll(@Request() req) {
    //   const owner_id = req.user.sub
    //   return this.analyticsService.findAll(owner_id);
    // }



}
