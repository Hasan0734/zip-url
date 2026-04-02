import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Url } from './schemas/url.schema';
import { nanoid } from 'nanoid'

@Injectable()
export class UrlsService {

  constructor(@InjectModel(Url.name) private urlModel) { }

  async create(createUrlDto: CreateUrlDto) {
    const short_code = nanoid(8)
    console.log(createUrlDto)

    return short_code

    try {
      const res = await this.urlModel.create({ ...createUrlDto });

      return res;
    } catch (error) {
      const keys = Object.keys(error.keyValue)
      const DUPLICATE_KEY_CODE = 11000;

      if (error.code === DUPLICATE_KEY_CODE) {
        const field = keys.map((key) => key)
        throw new ConflictException(`${field}, is already taken!`)
      }
      throw error;
    }
  }

  async findAll() {
    const urls = await this.urlModel.find();
    return urls;
  }

  findOne(id: number) {
    return `This action returns a #${id} url`;
  }

  update(id: number, updateUrlDto: UpdateUrlDto) {
    return `This action updates a #${id} url`;
  }

  remove(id: number) {
    return `This action removes a #${id} url`;
  }
}
