import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Url } from './schemas/url.schema';
import { nanoid } from 'nanoid'

@Injectable()
export class UrlsService {

  constructor(@InjectModel(Url.name) private urlModel) { }

  async create(createUrlDto: CreateUrlDto, owner_id: string) {
    const short_code = nanoid(8)

    try {
      const res = await this.urlModel.create({ ...createUrlDto, short_code, owner_id });

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

  async findAll(owner_id: string) {
    try {
      const urls = await this.urlModel.find({ owner_id }).exec();
      return urls;
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} url`;
  }
  async findUrlByCode(short_code: string) {
    try {
      const url = await this.urlModel.findOne({ short_code });
      console.log(url)
      if (!url) {
        throw new NotFoundException()
      }
      return url
    } catch (error) {
      throw error
    }
  }

  async update(_id: string, updateUrlDto: UpdateUrlDto) {

    try {
      const updated = await this.urlModel.findOneAndUpdate({ _id }, updateUrlDto, {
        returnDocument: 'after'
      })

      if (!updated) {
        throw new NotFoundException()
      }
      return { message: "URL updated!", status: "success" };
    } catch (error) {
      throw error;
    }
  }

  async remove(_id: string) {

    try {
      const url = await this.urlModel.findOneAndDelete({ _id });

      if (!url) {
        throw new NotFoundException()
      }
      return { message: "URL Deleted!", status: "success" };

    } catch (error) {
      throw error
    }
  }
}
