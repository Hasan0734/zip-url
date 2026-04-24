import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Request, UseGuards, Res, Req,
  BadRequestException,
  HttpStatus,
  UseInterceptors
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ClicksService } from 'src/clicks/clicks.service';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { EmailVerifiedGuard } from 'src/auth/guard/email-verified.guard';
import { RequireVerified } from 'src/auth/decorator/require-verified.decorator';

@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService,
    private clicksService: ClicksService,) { }

  @Post()
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @RequireVerified()
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
  // @UseInterceptors(CacheInterceptor)
  async verifyUrlPassword(@Param('short_code') short_code: string, @Body() body, @Res() res, @Req() req) {

    if (!body?.password) {
      return res.send({
        message: 'Password is required',
        status: 'failed'
      });
    }

    const result = await this.urlsService.findUrlByCode(short_code);
    if (result.type !== 'OK') return res.send({ status: 'failed', message: "Something wrong!" })
    const url = result.data;

    if (!url.password) throw new BadRequestException({ status: 'failed', message: 'Bad request!' });
    if (url.password !== body.password) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ status: 'failed', message: "Password wrong!" });
    }

    setImmediate(() => {
      this.clicksService.track(url, req);
    });

    return res.send({ status: 'success', url: url.original_url });


  }
}
