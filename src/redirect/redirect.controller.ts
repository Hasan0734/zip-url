import { Controller, Get, Param, Redirect, Render, Req, Res } from '@nestjs/common';
import { UrlsService } from 'src/urls/urls.service';

@Controller()
export class RedirctController {
    constructor(private urlsService: UrlsService) { }

    @Get(':short_code')
    async getUrl(@Param('short_code') short_code: string, @Res() res) {

        const result = await this.urlsService.findUrlByCode(short_code);
        switch (result.type) {
            case 'NOT_FOUND':
                return res.render('not_found.hbs');

            case 'DISABLED':
                return res.render('disabled.hbs');

            case 'EXPIRED':
                return res.render('expired.hbs');

            case 'OK':
                const url = result.data;

                if (url.password) {
                    return res.render('index', { short_code });
                }

                return res.redirect(302, url.original_url);
        }
    }
}
