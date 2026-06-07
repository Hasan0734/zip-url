import { Injectable, ConflictException, NotFoundException, Inject, InternalServerErrorException, } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Url } from './schemas/url.schema';
import { nanoid } from 'nanoid';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CustomAliasDto } from './dto/custom-alias.dto';
import { Types } from 'mongoose';
import { ClicksService } from 'src/clicks/clicks.service';
import { QueryTypes } from 'src/common/types';
import { Status } from './enum/status.enum';


type PopulateUrl = {
  populateName: string,
  populateSelect: string
}

@Injectable()
export class UrlsService {

  constructor(@InjectModel(Url.name) private urlModel, private clicksService: ClicksService, @Inject(CACHE_MANAGER) private cache: Cache) { }

  async create(createUrlDto: CreateUrlDto, owner_id: string, owner_name: string) {
    const short_code = nanoid(8)
    try {
      const res = await this.urlModel.create({ ...createUrlDto, short_code, owner_id, owner_name });
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

  async findAll(filters: any, queries: QueryTypes, populate?: PopulateUrl) {

    try {
      const urls = await this.urlModel.find(filters)
        .skip(queries.skip)
        .limit(queries.limit)
        .select(queries.fields)
        .sort(queries.sortBy)
        .populate(populate?.populateName, populate?.populateSelect)
        .exec()

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
      if (url.status === "banned") {
        return { type: 'BANNED' };
      }
      if (url.status === "pending") {
        return { type: 'PENDING' };
      }
      if (url.is_nsfw) {
        return { type: 'AGE_VERIFICATION', targetUrl: url?.original_url };
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

  async update(_id: string, updateUrlDto: UpdateUrlDto, owner_id: Types.ObjectId) {
    const $set: Record<string, any> = {};
    const $unset: Record<string, string> = {};
    const nullableFields = ['custom_alias', 'password', 'expires_at'];
    const updatePayload: any = {}
    try {
      Object.keys(updateUrlDto).forEach(key => {
        const value = updateUrlDto[key as keyof UpdateUrlDto];
        if (value === undefined && nullableFields.includes(key)) {
          $unset[key] = ""
        }
        else if (value !== undefined) {
          $set[key] = value;
        }
      });

      if (Object.keys($set).length > 0) updatePayload.$set = $set;
      if (Object.keys($unset).length > 0) updatePayload.$unset = $unset;

      if (Object.keys(updatePayload).length === 0) {
        return {
          success: false,
          message: "Not found any property to update."
        }
      }

      const updateDoc = await this.urlModel.findOneAndUpdate({ _id, owner_id }, updatePayload, { returnDocument: 'after' })
      if (!updateDoc) {
        throw new NotFoundException()
      }

      const shortCodeKey = `short:${updateDoc.short_code}`;
      await this.cache.del(shortCodeKey);

      if (updateDoc?.custom_alias) {
        await this.cache.del(`short:${updateDoc.custom_alias}`);
      }

      return { message: "URL updated!", success: true };
    } catch (error) {
      return new InternalServerErrorException()
    }

  }

  async changeUrlStatus(_id: Types.ObjectId, status: Status) {
    try {

      const url = await this.urlModel
        .findOneAndUpdate({ _id }, { status }, {
          returnDocument: 'after',
        })
      if (!url) {
        throw new NotFoundException('Url not found!');
      }
      const shortCodeKey = `short:${url.short_code}`;
      await this.cache.del(shortCodeKey);

      if (url?.custom_alias) {
        await this.cache.del(`short:${url.custom_alias}`);
      }
      return {
        success: true,
        message: "Url status changed!"
      };
    } catch (error) {
      throw error;
    }
  }
  async changeUrlNsfw(_id: Types.ObjectId, is_nsfw: boolean) {
    try {

      const url = await this.urlModel
        .findOneAndUpdate({ _id }, { is_nsfw }, {
          returnDocument: 'after',
        })
      if (!url) {
        throw new NotFoundException('Not found url');
      }
      const shortCodeKey = `short:${url.short_code}`;
      await this.cache.del(shortCodeKey);

      if (url?.custom_alias) {
        await this.cache.del(`short:${url.custom_alias}`);
      }
      return {
        success: true,
        message: "Url nsfw changed!"
      };
    } catch (error) {
      throw error;
    }
  }

  async remove(_id: Types.ObjectId, owner_id: Types.ObjectId, isAdmin: boolean) {

    let filter: any = {}

    if (!isAdmin) {
      filter.owner_id = owner_id
    }


    try {
      const url = await this.urlModel.findOneAndDelete({ _id, ...filter });
      const shortCodeKey = `short:${url.short_code}`;
      await this.cache.del(shortCodeKey);

      if (url.custom_alias) {
        const customAliasKey = `short:${url.custom_alias}`;
        await this.cache.del(customAliasKey);
      }

      if (!url) {
        throw new NotFoundException()
      }

      await this.clicksService.deleteAllByUrlId(_id)

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

      const res = await this.urlModel.findOne({ custom_alias, _id: { $ne: customAliasDto.url_id } });

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

  async getStatsSummary(owner_id?: Types.ObjectId) {
    try {

      const ownerObjectId = typeof owner_id === 'string' ? new Types.ObjectId(owner_id) : owner_id

      const filters: any = {}
      const match: any = {
      }

      if (owner_id) {
        filters.owner_id = owner_id;
        match.owner_id = ownerObjectId
      }

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [total, activeLinks, todayCreated, last24HoursAgo, clickStats, last24HoursClicksStats, visitor, expired, getTopRegion] = await Promise.all([
        this.urlModel.countDocuments(filters),
        this.urlModel.countDocuments({ ...filters, is_active: true }),
        this.urlModel.countDocuments({ ...filters, createdAt: { $gte: startOfToday } }),
        this.urlModel.countDocuments({ ...filters, createdAt: { $gte: twentyFourHoursAgo } }),
        this.urlModel.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: "$click_count" } } }
        ]),
        this.urlModel.aggregate([
          { $match: { ...match, createdAt: { $gte: twentyFourHoursAgo } } },
          { $group: { _id: null, total: { $sum: "$click_count" } } }
        ]
        ),
        this.clicksService.getUniqueVisitor(owner_id),
        this.urlModel.aggregate([
          {
            $match: {
              ...match,
              expires_at: { $exists: true, $ne: null },
              $expr: {
                $lt: ["$expires_at", "$$NOW"]
              }
            }
          },
          {
            $count: "total_expired"
          }
        ]
        ),
        this.clicksService.getTopRegion(owner_id)
      ])

      const totalClicks = clickStats[0]?.total || 0;
      const last24HoursClicks = last24HoursClicksStats[0]?.total || 0;
      const expiredLinks = expired[0]?.total_expired || 0
      const topRegion = getTopRegion[0] || {}
      return {
        total,
        activeLinks,
        todayCreated,
        last24HoursAgo,
        totalClicks,
        last24HoursClicks,
        visitor,
        expiredLinks,
        topRegion
      };
    } catch (error) {
      throw error;
    }
  }

  async getAnalytics(owner_id?: Types.ObjectId, _id?: Types.ObjectId) {

    try {
      const urlId = typeof _id === "string" ? new Types.ObjectId(_id) : _id

      const [WeeklyData, topCountries, devices, last7DaysAgo, last30Days, visitor, totalClicks] = await Promise.all([
        this.clicksService.getAllUrlWeekData(owner_id, _id),
        this.clicksService.getToCountries(owner_id, _id),
        this.clicksService.getAllDevices(owner_id, _id),
        this.clicksService.last7DaysAgo(owner_id, _id),
        this.clicksService.last30Days(owner_id, _id),
        this.clicksService.getUniqueVisitor(owner_id, _id),
        this.clicksService.getTotalClicks(owner_id, _id)

      ])

      return { topCountries, devices, ...WeeklyData, last7DaysAgo, last30Days, visitor, totalClicks }

    } catch (error) {
      throw error
    }
  }

  async getAdminAnalytics(day: number) {
    try {
      const result = await this.urlModel.aggregate([
        {
          $match: {
            $expr: {
              $gte: [
                "$createdAt",
                {
                  $dateSubtract: {
                    startDate: {
                      $dateTrunc: {
                        date: "$$NOW",
                        unit: "day",
                        timezone: "UTC"
                      }
                    },
                    amount: day,
                    unit: "day"
                  }
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            _id: 1
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            count: 1
          }
        }
      ])
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getStatsByAdmin() {
    try {
      const [urlData, visitor, totalClicks] = await Promise.all([
        this.urlModel.aggregate([
          {
            $group: {
              _id: null,
              activeUrls: {
                $sum: { $cond: ["$is_active", 1, 0] }
              },
              todayCreatedUrls: {
                $sum: {
                  $cond: [
                    {
                      $gte: [
                        "$createdAt",
                        {
                          $dateTrunc: {
                            date: "$$NOW",
                            unit: "day"
                          }
                        }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              totalUrls: { $sum: 1 },
              totalClicks: { $sum: "$click_count" }
            }
          },
          { $project: { _id: 0 } }
        ]),
        this.clicksService.getUniqueVisitor(),
        this.clicksService.getTotalClicks()
      ])
      const result = urlData[0] || null
      return { ...result, totalClicks, visitor }
    } catch (error) {
      throw error;
    }
  }
}
