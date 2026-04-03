import { Controller, Get, Param, Redirect, Render, Req, Res } from '@nestjs/common';
import { UrlsService } from 'src/urls/urls.service';

@Controller()
export class RedirctController {
    constructor(private urlsService: UrlsService) { }

    @Get(':short_code')
    async getUrl(@Param('short_code') short_code: string, @Res() res) {


        const url = await this.urlsService.findUrlByCode(short_code);
        
        if (url.status === 'failed') {
            return {message: ""};
        }

        if (url?.password) {

          return res.render('index')

        }

        return res.redirect(302, url.original_url)
    }
}
