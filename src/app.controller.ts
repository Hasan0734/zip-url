import { Controller, Get, Res, } from '@nestjs/common';
import { AppService } from './app.service';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }


  @Get()
  redirectClientSide(@Res() res) {
    return res.redirect(307, process.env.APP_URL);
  }

  @Get('/health')
  getHealth() {
    return this.appService.getHealth();
  }

}
