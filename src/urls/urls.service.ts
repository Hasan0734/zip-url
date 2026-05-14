import { Injectable, ConflictException, NotFoundException, Inject, } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Url } from './schemas/url.schema';
import { nanoid } from 'nanoid';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CustomAliasDto } from './dto/custom-alias.dto';
import { Types } from 'mongoose';


type QueryTypes = {
  limit: number;
  sortBy: string;
  fields: string;
  skip: number;
}

@Injectable()
export class UrlsService {

  constructor(@InjectModel(Url.name) private urlModel, @Inject(CACHE_MANAGER) private cache: Cache) { }

  async create(createUrlDto: CreateUrlDto, owner_id: string) {
    const short_code = nanoid(8)
    try {
      const res = await this.urlModel.create({ ...createUrlDto, short_code, owner_id });
      return {
        success: true,
        message: "Added new url successfully",
        url: res
      };
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

  async findAll(filters: any, queries: QueryTypes) {

    try {
      const urls = await this.urlModel.find(filters)
        .skip(queries.skip)
        .limit(queries.limit)
        .select(queries.fields)
        .sort(queries.sortBy);

      const total = await this.urlModel.find(filters).countDocuments();
      const page = Math.ceil(total / queries.limit)

      return {
        urls,
        total,
        page,
        limit: queries.limit
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
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

      if (!url.is_active) {
        return { type: 'DISABLED' };
      }
      if (url.expires_at && url.expires_at < new Date()) {
        return { type: 'EXPIRED' };
      }
      await this.cache.set(shortCodeKey, url, 3600000)
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

      const shortCodeKey = `short:${updated.short_code}`;
      await this.cache.del(shortCodeKey);

      if (updated.custom_alias) {
        await this.cache.del(`short:${updated.custom_alias}`);
      }

      return { message: "URL updated!", success: true };
    } catch (error) {
      throw error;
    }
  }

  async remove(_id: string) {

    try {
      const url = await this.urlModel.findOneAndDelete({ _id });
      const shortCodeKey = `short:${url.short_code}`;
      await this.cache.del(shortCodeKey);

      if (url.custom_alias) {
        const customAliasKey = `short:${url.custom_alias}`;
        await this.cache.del(customAliasKey);
      }

      if (!url) {
        throw new NotFoundException()
      }
      return { message: "URL Deleted!", success: true };
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

  async customAliasAvailable(customAliasDto: CustomAliasDto) {
    try {
      const custom_alias = customAliasDto.custom_alias

      const res = await this.urlModel.findOne({ custom_alias });

      if (!res) {
        return {
          message: "Alias is vailable",
          success: true,
        }
      }

      return {
        message: "Alias is not available",
        success: false
      }

    } catch (error) {

    }
  }

  async getStaticSummary(owner_id: Types.ObjectId) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, activeLinks, todayCreated, last24HoursAgo, clickStats] = await Promise.all([
      this.urlModel.countDocuments({ owner_id }),
      this.urlModel.countDocuments({ owner_id, is_active: true }),
      this.urlModel.countDocuments({ owner_id, createdAt: { $gte: startOfToday } }),
      this.urlModel.countDocuments({ owner_id, createdAt: { $gte: twentyFourHoursAgo } }),
      this.urlModel.aggregate([
        { $match: { owner_id } },
        { $group: { _id: null, total: { $sum: "$click_count" } } }
      ])
    ])

    const totalClicks = clickStats[0]?.total || 0;
    // const total = await this.urlModel.countDocuments({ owner_id })
    // const activeLinks = await this.urlModel.countDocuments({ owner_id, is_active: true })
    // const todayCreated = await this.urlModel.countDocuments({ owner_id, createdAt: { $gte: startOfToday } })
    // const last24HoursAgo = await this.urlModel.countDocuments({ owner_id, createdAt: { $gte: twentyFourHoursAgo } })

    return {
      total,
      activeLinks,
      todayCreated,
      last24HoursAgo,
      totalClicks
    };
  }
}
