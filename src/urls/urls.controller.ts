import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Req, Res } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) { }

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

  async verifyUrlPassword(@Param('short_code') short_code: string, @Body() body) {
    const password = body?.password
    const url = await this.urlsService.findUrlByCode(short_code);

    if(!password) {
      return {message: "Password is required!"}
    }

    if (url.password !== password) {
      return { message: "Password not matched!", status: 'failed' }
    }
    return { original_url: url.original_url, status: 'success' }
  }
}
