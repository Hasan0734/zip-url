import { Controller, Get, Param, Redirect, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { UrlsService } from './urls/urls.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private urlsService: UrlsService) { }

  @Get('/health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get(':short_code')
  @Redirect()
  async getUrl(@Param('short_code') short_code: string, @Res() res: Response) {
    const url = await this.urlsService.findUrlByCode(short_code)
    return { url: url.original_url }
  }
}
