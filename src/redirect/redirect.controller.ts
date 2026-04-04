import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import { ClicksService } from 'src/clicks/clicks.service';
import { parseUserAgent } from 'src/lib/parse-user-agent';
import { UrlsService } from 'src/urls/urls.service';

@Controller()
export class RedirctController {
    constructor(private urlsService: UrlsService, private clicksService: ClicksService) { }

    @Get(':short_code')
    async getUrl(@Param('short_code') short_code: string, @Res() res, @Headers() headers) {




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
                const userAgent = headers['user-agent'] ?? "unknown";

                const ip = headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
                    headers["x-real-ip"] ??
                    "0.0.0.0";

                const client = parseUserAgent(userAgent);

                this.urlsService.incrementClick(url._id)
                this.clicksService.create({ ...client, ip })

                return res.redirect(302, url.original_url);
        }
    }
}
