import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Headers, Res, Req } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ClicksService } from 'src/clicks/clicks.service';
import { parseUserAgent } from 'src/lib/parse-user-agent';
import { getGeoData } from 'src/lib/get-geo-info';

@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService, private clicksService: ClicksService) { }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createUrlDto: CreateUrlDto, @Request() req) {
    const userId = req.user.sub
    return await this.urlsService.create(createUrlDto, userId);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req) {
    const userId = req.user.sub
    return await this.urlsService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string) {

    return await this.urlsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() updateUrlDto: UpdateUrlDto) {
    return await this.urlsService.update(id, updateUrlDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.urlsService.remove(id);
  }

  @Post('/verify/:short_code')
  async verifyUrlPassword(@Param('short_code') short_code: string, @Body() body, @Res() res, @Req() req) {

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
        if (!body?.password) {
          return res.send({
            message: 'Password is required',
            status: 'failed'
          });
        }
        if (url.password !== body.password) {

          return res.send({ status: 'failed', message: "Password wrong!" });
        }
        // const ip =
        //   typeof req.headers['x-forwarded-for'] === 'string'
        //     ? req.headers['x-forwarded-for'].split(',')[0]
        //     : req.ip;

        // const geoData = await getGeoData(ip);
        // const userAgent = req.headers['user-agent'] ?? "unknown";
        // const client = parseUserAgent(userAgent);

        // const clickDto = { owner: url.owner_id, url: url._id, ip, country: geoData.country, city: geoData.city, device: client.device_type, browser: client.browser }

        // this.clicksService.create(clickDto);
        // this.urlsService.incrementClick(url._id)

      

        return res.send({ status: 'failed', message: "Password wrong!" });
    }


  }
}
