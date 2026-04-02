import { Injectable } from '@nestjs/common';
import { CreateClickDto } from './dto/create-click.dto';
import { UpdateClickDto } from './dto/update-click.dto';

@Injectable()
export class ClicksService {
  create(createClickDto: CreateClickDto) {
    return 'This action adds a new click';
  }

  findAll() {
    return `This action returns all clicks`;
  }

  findOne(id: number) {
    return `This action returns a #${id} click`;
  }

  update(id: number, updateClickDto: UpdateClickDto) {
    return `This action updates a #${id} click`;
  }

  remove(id: number) {
    return `This action removes a #${id} click`;
  }
}
