import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { Controller, Get, Param, Req, Res, UseInterceptors } from '@nestjs/common';
import { ClicksService } from 'src/clicks/clicks.service';

import { UrlsService } from 'src/urls/urls.service';

@Controller()
export class RedirctController {
    constructor(private urlsService: UrlsService, private clicksService: ClicksService) { }


    @Get(':short_code')
    // @UseInterceptors(CacheInterceptor)

    async getUrl(
        @Param('short_code') short_code: string, @Res() res, @Req() req) {
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

                setImmediate(() => {
                    this.clicksService.track(url, req);
                });

                return res.redirect(307, url.original_url);
        }
        return res.render('not_found.hbs');
    }

}


