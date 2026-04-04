import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ClicksService } from './clicks.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('clicks')
export class ClicksController {
  constructor(private readonly clicksService: ClicksService) { }

  // @Post()
  // create(@Body() createClickDto: CreateClickDto) {
  //     console.log(createClickDto)
  //   return this.clicksService.create(createClickDto);
  // }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Request() req) {
    const owner_id = req.user.sub
    return this.clicksService.findAll(owner_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clicksService.findOne(id);
  }

}
