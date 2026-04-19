import { Injectable, ConflictException, NotFoundException, Inject, } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Url } from './schemas/url.schema';
import { nanoid } from 'nanoid';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';


@Injectable()
export class UrlsService {

  constructor(@InjectModel(Url.name) private urlModel, @Inject(CACHE_MANAGER) private cache: Cache) { }

  async create(createUrlDto: CreateUrlDto, owner_id: string) {
    const short_code = nanoid(8)
    try {
      const res = await this.urlModel.create({ ...createUrlDto, short_code, owner_id });
      return res;
    } catch (err: unknown) {
      const error = err as { code?: number, keyValue: string[] }
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
      const shortCodeKey = `short:${short_code}`;
      const data = await this.cache.get(shortCodeKey);
      if (data) return { type: 'OK', data };
      const url = await this.urlModel.findOne({ $or: [{ short_code }, { custom_alias: short_code }] });
      if (!url) {
        return { type: 'NOT_FOUND' };
      }
      await this.cache.set(shortCodeKey, url, 3600000) // 3600000 1hours cache
      if (!url.is_active) {
        return { type: 'DISABLED' };
      }
      if (url.expires_at && url.expires_at < new Date()) {
        return { type: 'EXPIRED' };
      }
      return { type: 'OK', data: url };
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

  async incrementClick(_id: string) {
    try {
      await this.urlModel.updateOne({ _id }, { $inc: { click_count: 1 } })
    } catch (error) {
      throw error;
    }
  }
}
