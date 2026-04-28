import { forwardRef, NotFoundException } from '@nestjs/common';
import { CreateClickDto } from './dto/create-click.dto';
import { Click } from './schemas/click.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import axios from 'axios';
import { UAParser } from 'ua-parser-js';
import { UrlsService } from 'src/urls/urls.service';

@Injectable()
export class ClicksService {

  constructor(@InjectModel(Click.name) private clickModel,
    @Inject(CACHE_MANAGER) private cache: Cache,
    @Inject(forwardRef(() => UrlsService))
    private urlsService: UrlsService) { }

  async create(createClickDto: CreateClickDto) {
    try {
      const result = await this.clickModel.create(createClickDto)
      return result;

    } catch (error) {
      throw error;
    }
  }

  async findAll(owner_id: string, url_id?: string) {
    try {
      const result = await this.clickModel.find({ $or: [{ owner_id }, { url_id }] }).exec()
      return result;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const result = await this.clickModel
        .findOne({ _id: id })
        .populate({
          path: 'owner',
          select: "first_name last_name email -_id"
        })
        .populate({ path: 'url', select: '-createdAt -updatedAt -owner_id -__v' });

      if (!result) {
        throw new NotFoundException()
      }
      return result;
    } catch (err) {
      const error = err as { kind?: string }

      if (error.kind === "ObjectId") {
        throw new NotFoundException({ message: "Invalid _id" })
      }
      throw error;
    }
  }


  async track(url: any, req: any) {

    try {
      const ip = this.getIp(req)
      const ua = req.headers['user-agent'] ?? "unknown";
      const key = `click:${url._id}:${ip}`;
      const exists = await this.cache.get(key);

      if (exists) return;
      await this.cache.set(key, true, 10000) // 10 seconds (ms)

      // now do heavy work
      const geoData = await this.getGeoData(ip);
      const client = this.parseUserAgent(ua);

      const clickDto = {
        owner: url.owner_id,
        url: url._id,
        ip,
        country: geoData.country,
        city: geoData.city,
        device: client.device_type,
        browser: client.browser
      };

      await this.create(clickDto);
      await this.urlsService.incrementClick(url._id);

    } catch (error) {

    }
  }

  private getIp(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0];
    }

    return req.ip;
  }

  private async getGeoData(ip: string) {
    const geoKey = `geo:${ip}`;
    let geoData = await this.cache.get(geoKey);

    if (geoData) return geoData;

    if (ip === '::1' || '127:0.0.1') {
      const res = await axios(`http://ip-api.com/json/`)
      await this.cache.set(geoKey, res.data, 3600000)
      return res.data;
    }
    const res = await axios(`http://ip-api.com/json/${ip}`);
    await this.cache.set(geoKey, res.data, 3600000)
    return res.data;
  }

  private parseUserAgent(ua: string) {
    const parser = new UAParser(ua);
    const r = parser.getResult();

    return {
      device_type: r.device.type ?? "desktop",
      os: r.os.name?.toLowerCase() ?? "unknown",
      os_version: r.os.version ?? null,
      browser: r.browser.name?.toLowerCase() ?? "unknown",
      browser_version: r.browser.version ?? null,
      isBot: /bot|crawler|spider|crawling/i.test(ua),
    };
  }
}
