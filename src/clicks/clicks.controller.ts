import { Controller, Get, Param, UseGuards, Request, Req, Query } from '@nestjs/common';
import { ClicksService } from './clicks.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

@Controller('clicks')
export class ClicksController {
  constructor(private readonly clicksService: ClicksService) { }

  // @Get('/all-devices')
  // @UseGuards(AuthGuard)
  // findAll(@Request() req) {
  //   const owner_id = req.user.sub
  //   return this.clicksService.getAllDevices(owner_id);
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.clicksService.findOne(id);
  // }
  @Get('/')
  @UseGuards(AuthGuard)
  async findAll(@Req() req, @Query() queries) {
    const owner_id = req.user.sub

    const {
      sort,
      page = "1",
      limit,
      fields,
      search,
    } = queries;

    const filters: any = Object.fromEntries(Object.entries(queries).filter(([key]) => !["sort", "page", "limit", "fields", "search", "owner"].includes(key)))


    if (search) {
      const searchRegex = new RegExp(queries.search, 'i');

      filters.$or = [
        { country: { $regex: searchRegex } },
        { city: { $regex: searchRegex } },
        { device: { $regex: searchRegex } },
        { os: { $regex: searchRegex } },
        { ip: { $regex: searchRegex } },
        { browser: { $regex: searchRegex } },

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


    if (req.user.role === 'admin') {
      return this.clicksService.findAll(filters, queryOption)

    }


    return this.clicksService.findAll({ filters, owner: owner_id }, queryOption)
  }

}
