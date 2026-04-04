import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClicksService } from './clicks.service';
import { CreateClickDto } from './dto/create-click.dto';

@Controller('clicks')
export class ClicksController {
  constructor(private readonly clicksService: ClicksService) {}

  @Post()
  create(@Body() createClickDto: CreateClickDto) {
    return this.clicksService.create(createClickDto);
  }

  @Get()
  findAll() {
    return this.clicksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clicksService.findOne(+id);
  }

}
