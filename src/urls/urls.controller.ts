import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Request, UseGuards, Res, Req,
  BadRequestException,
  HttpStatus,
  UseInterceptors,
  Query
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ClicksService } from 'src/clicks/clicks.service';
import { EmailVerifiedGuard } from 'src/auth/guard/email-verified.guard';
import { RequireVerified } from 'src/auth/decorator/require-verified.decorator';
import { CustomAliasDto } from './dto/custom-alias.dto';
import { Throttle } from '@nestjs/throttler';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

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

  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req, @Query() queries) {

    const owner_id = req.user.sub

    const {
      sort,
      page = "1",
      limit,
      fields,
      search,
      is_active,
    } = queries;

    const filters: any = Object.fromEntries(Object.entries(queries).filter(([key]) => !["sort", "page", "limit", "fields", "search", "owner_id"].includes(key)))


    if (is_active !== undefined) {
      filters.is_active = JSON.parse(is_active as string)
    }

    if (search) {
      const searchRegex = new RegExp(queries.search, 'i');

      filters.$or = [
        { original_url: { $regex: searchRegex } },
        { short_code: { $regex: searchRegex } },
        { custom_alias: { $regex: searchRegex } }
      ]
    }

    const parsedLimit = Math.min(
      Number(limit) || DEFAULT_LIMIT,
      MAX_LIMIT
    );

    const parsedPage = Math.max(
      Number(page) || 1,
      1
    );

    const queryOption = {
      limit: parsedLimit,
      skip: (parsedPage - 1) * parsedLimit,
      ...(sort && {
        sortBy: (sort as string).split(",").join(" ")
      }),
      ...(fields && {
        fields: (fields as string).split(',').join(" ")
      })
    }

    // let filters = { ...req.query };
    // const excludeFields = ["sort", "page", "limit", "fields", "owner_id", "search"];
    // excludeFields.forEach((field) => delete filters[field]);

    // if (queries?.is_active) {
    //   filters.is_active = JSON.parse(queries.is_active)
    // }

    // if (queries?.search) {
    //   const searchRegex = new RegExp(queries.search, 'i');

    //   filters = {
    //     ...filters,
    //     $or: [
    //       { original_url: { $regex: searchRegex } },
    //       { short_code: { $regex: searchRegex } },
    //       { custom_alias: { $regex: searchRegex } }
    //     ]
    //   }
    // }
    // const newQueries: any = {
    //   limit: 20,
    //   skip: 0
    // }

    // if (queries.sort) {
    //   const sortBy = queries.sort.split(',').join(' ');
    //   newQueries.sortBy = sortBy;
    // }
    // if (queries.fields) {
    //   const fields = queries.fields.split(',').join(' ');
    //   newQueries.fields = fields;
    // }
    // if (queries.page) {

    //   const page = queries.page === '0' ? 1 : queries.page;
    //   const { limit = 10 } = queries;

    //   const skip = (page - 1) * parseInt(limit);
    //   newQueries.skip = skip;
    //   newQueries.limit = limit
    // }

    // if (queries.limit) {
    //   const limit = Number(queries.limit);

    //   if (limit > 50) {
    //     newQueries.limit = 50
    //   } else {
    //     newQueries.limit = limit
    //   }
    // }


    return await this.urlsService.findAll({ ...filters, owner_id }, queryOption);
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
        success: false
      });
    }

    const result = await this.urlsService.findUrlByCode(short_code);
    if (result.type !== 'OK') return res.send({ success: false, message: "Something wrong!" })
    const url = result.data;

    if (!url.password) throw new BadRequestException({ success: false, message: 'Bad request!' });
    if (url.password !== body.password) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ success: false, message: "Password wrong!" });
    }

    setImmediate(() => {
      this.clicksService.track(url, req);
    });

    return res.send({ success: true, url: url.original_url });


  }

  @Post("/check/custom-alias")
  async customAliasAvailable(@Body() customAliasDto: CustomAliasDto) {
    return await this.urlsService.customAliasAvailable(customAliasDto)
  }

  @Get('stats/summary')
  @UseGuards(AuthGuard)
  async getStats(@Request() req) {
    const owner_id = req.user.sub

    return this.urlsService.getStaticSummary(owner_id)
  }

}
