import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Get, Headers, HttpStatus, Inject, Ip, Param, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ClicksService } from 'src/clicks/clicks.service';
import { getGeoData } from 'src/lib/get-geo-info';
import { parseUserAgent } from 'src/lib/parse-user-agent';
import { UrlsService } from 'src/urls/urls.service';

@Controller()
export class RedirctController {
    constructor(private urlsService: UrlsService, private clicksService: ClicksService, @Inject(CACHE_MANAGER) private cache: Cache) { }


    @Get(':short_code')
    async getUrl(
        @Param('short_code') short_code: string, @Res() res, @Req() req) {

        console.log("short_code:", short_code);

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

                this.logClickSafely(url, ip, req.headers['user-agent']);

                // const geoData = await getGeoData(ip);
                // const userAgent = req.headers['user-agent'] ?? "unknown";
                // const client = parseUserAgent(userAgent);

                // // console.log({client})
                // const clickDto = {
                //     owner: url.owner_id,
                //     url: url._id, ip,
                //     country: geoData.country,
                //     city: geoData.city,
                //     device: client.device_type,
                //     browser: client.browser
                // }

                // console.log({ clicked: clickDto })
                // this.clicksService.create(clickDto);
                // this.urlsService.incrementClick(url._id)

                return res.redirect(307, url.original_url);
        }
        return res.render('not_found.hbs');
    }


    public async logClickSafely(url: any, ip: string, ua: string) {
        try {
            const geoData = await getGeoData(ip);
            const client = parseUserAgent(ua ?? "unknown");
            console.log({ owner: url.owner_id })
            const clickDto = {
                owner: url.owner_id,
                url: url._id,
                ip,
                country: geoData.country,
                city: geoData.city,
                device: client.device_type,
                browser: client.browser
            };
            const key = `click:${url._id}:${ip}`;
            const exists = await this.cache.get(key);

            if (!exists) {
                console.log(key)
                await this.cache.set(key, true, 10000) // 10 seconds (ms)
                await this.clicksService.create(clickDto);
                await this.urlsService.incrementClick(url._id);
            }

        } catch (err) {
            console.error("Failed to log click:", err);
        }
    }
}


