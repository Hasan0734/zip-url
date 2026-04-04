import { Controller, Get, Headers, Ip, Param, Req, Res } from '@nestjs/common';
import { ClicksService } from 'src/clicks/clicks.service';
import { getGeoData } from 'src/lib/get-geo-info';
import { parseUserAgent } from 'src/lib/parse-user-agent';
import { UrlsService } from 'src/urls/urls.service';

@Controller()
export class RedirctController {
    constructor(private urlsService: UrlsService, private clicksService: ClicksService) { }

    @Get(':short_code')
    async getUrl(@Param('short_code') short_code: string, @Res() res, @Req() req) {

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

                const ip =
                    typeof req.headers['x-forwarded-for'] === 'string'
                        ? req.headers['x-forwarded-for'].split(',')[0]
                        : req.ip;

                const geoData = await getGeoData(ip);
                const userAgent = req.headers['user-agent'] ?? "unknown";
                const client = parseUserAgent(userAgent);

                const clickDto = { owner_id: url.owner_id, url_id: url._id, ip, country: geoData.country, city: geoData.city, device: client.device_type, browser: client.browser }

                this.clicksService.create(clickDto);
                this.urlsService.incrementClick(url._id)

                return res.redirect(302, url.original_url);
        }
        
    }
}
