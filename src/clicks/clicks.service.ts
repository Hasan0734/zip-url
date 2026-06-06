import { forwardRef, NotFoundException } from '@nestjs/common';
import { CreateClickDto } from './dto/create-click.dto';
import { Click } from './schemas/click.schema';
import { InjectModel, IsObjectIdPipe } from '@nestjs/mongoose';
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import axios from 'axios';
import { UAParser } from 'ua-parser-js';
import { UrlsService } from 'src/urls/urls.service';
import { Types, ObjectId } from 'mongoose';

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

  async deleteByUrlId(id: Types.ObjectId, owner_id: Types.ObjectId) {
    try {
      const url = await this.clickModel.findOneAndDelete({ id, owner: owner_id });

      if (!url) {
        throw new NotFoundException()
      }

      return { message: "URL Deleted!", success: true };
    } catch (error) {
      throw error
    }
  }
  async deleteAllByUrlId(_id: Types.ObjectId) {
    try {
      const urls = await this.clickModel.deleteMany({ url: _id })

      // if (!urls.length) {
      //   throw new NotFoundException("Url id not found to delete clicks.")
      // }
      return { message: "Clicks deleted by url id", success: true }
    } catch (error) {
      throw error;
    }
  }
  async getToCountries(owner?: Types.ObjectId, urlId?: Types.ObjectId) {
    const ownerObjectId = typeof owner === 'string' ? new Types.ObjectId(owner) : owner;
    const matchQuery: any = {}
    if (urlId) {
      matchQuery.url = new Types.ObjectId(urlId)
    }
    if (owner) {
      matchQuery.owner = ownerObjectId
    }

    try {
      const data = await this.clickModel.aggregate([
        {
          $match: matchQuery
        },
        {
          $group: {
            _id: "$country",
            countryClicks: { $sum: 1 }
          }
        },
        {
          $setWindowFields: {
            output: {
              grandTotalClicks: {
                $sum: "$countryClicks"
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            country: { $ifNull: ["$_id", "Unknown"] },
            clicks: "$countryClicks",
            percentage: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        "$countryClicks",
                        "$grandTotalClicks"
                      ]
                    },
                    100
                  ]
                }
              ]
            }
          }
        },
        {
          $sort: {
            percentage: -1
          }
        }
      ])
      return data;
    } catch (error) {
      console.log(error)
      throw error;
    }

  }
  async getAllDevices(owner?: Types.ObjectId, urlId?: Types.ObjectId) {

    const ownerObjectId = typeof owner === 'string' ? new Types.ObjectId(owner) : owner;
    const matchQuery: any = {}
    if (urlId) {
      matchQuery.url = new Types.ObjectId(urlId)
    }
    if (owner) {
      matchQuery.owner = ownerObjectId
    }

    try {
      const data = await this.clickModel.aggregate([
        {
          $match: matchQuery
        },
        {
          $group: {
            _id: "$device",
            deviceClicks: { $sum: 1 }
          }
        },
        {
          $setWindowFields: {
            output: {
              grandTotalClicks: {
                $sum: "$deviceClicks"
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            device: { $ifNull: ["$_id", "Unknown"] },
            clicks: "$deviceClicks",
            percentage: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        "$deviceClicks",
                        "$grandTotalClicks"
                      ]
                    },
                    100
                  ]
                }
              ]
            }
          }
        },
        {
          $sort: {
            percentage: -1
          }
        }
      ])

      return data;
    } catch (error) {
      throw error;
    }

  }
  async getAllUrlWeekData(owner?: Types.ObjectId, urlId?: Types.ObjectId) {
    try {
      const ownerObjectId = typeof owner === 'string' ? new Types.ObjectId(owner) : owner;

      const matchQuery: any = {}

      if (urlId) {
        matchQuery.url = new Types.ObjectId(urlId)
      }
      if (owner) {
        matchQuery.owner = ownerObjectId
      }

      const [previousWeek, currentWeek] = await Promise.all([
        await this.clickModel.aggregate(
          [
            {
              $match: {
                ...matchQuery,

                $expr: {
                  $and: [
                    {
                      $gte: [
                        "$createdAt",
                        {
                          $dateSubtract: {
                            startDate: {
                              $dateTrunc: { date: "$$NOW", unit: "week", startOfWeek: "Mon", timezone: "UTC" }
                            },
                            amount: 1,
                            unit: "week"
                          }
                        }
                      ]
                    },
                    {
                      $lt: [
                        "$createdAt",
                        {
                          $dateTrunc: { date: "$$NOW", unit: "week", startOfWeek: "Mon", timezone: "UTC" }
                        }
                      ]
                    }
                  ]
                }
              }
            },
            {
              $group: {
                _id: { $isoDayOfWeek: { date: "$createdAt", timezone: "UTC" } },
                clicks: { $sum: 1 }
              }
            },
            {
              // Group everything together, but also calculate the target Monday of last week
              $group: {
                _id: null,
                lastMonday: {
                  $first: {
                    $dateSubtract: {
                      startDate: {
                        $dateTrunc: { date: "$$NOW", unit: "week", startOfWeek: "Mon", timezone: "UTC" }
                      },
                      amount: 1,
                      unit: "week"
                    }
                  }
                },
                stats: { $push: { dayNum: "$_id", clicks: "$clicks" } }
              }
            },
            {
              $project: {
                _id: 0,
                days: {
                  $map: {
                    input: [
                      // dayOffset represents how many days to add to Monday (Mon = +0, Tue = +1, etc.)
                      { num: 1, name: "Mon", dayOffset: 0 },
                      { num: 2, name: "Tue", dayOffset: 1 },
                      { num: 3, name: "Wed", dayOffset: 2 },
                      { num: 4, name: "Thu", dayOffset: 3 },
                      { num: 5, name: "Fri", dayOffset: 4 },
                      { num: 6, name: "Sat", dayOffset: 5 },
                      { num: 7, name: "Sun", dayOffset: 6 }
                    ],
                    as: "d",
                    in: {
                      day: "$$d.name",
                      // Dynamically calculate the exact date for this specific weekday
                      date: {
                        $dateAdd: {
                          startDate: "$lastMonday",
                          unit: "day",
                          amount: "$$d.dayOffset",
                          timezone: "UTC"
                        }
                      },
                      clicks: {
                        $let: {
                          vars: {
                            matchedDay: {
                              $filter: {
                                input: "$stats",
                                cond: { $eq: ["$$this.dayNum", "$$d.num"] }
                              }
                            }
                          },
                          in: {
                            $ifNull: [
                              { $arrayElemAt: ["$$matchedDay.clicks", 0] },
                              0
                            ]
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            {
              $unwind: "$days"
            },
            {
              $project: {
                day: "$days.day",
                clicks: "$days.clicks",
                date: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$days.date",
                    timezone: "UTC"
                  }
                }
              }
            }
          ]
        ),
        await this.clickModel.aggregate([
          {
            $match: {
              ...matchQuery,
              $expr: {
                $gte: [
                  "$createdAt",
                  {
                    $dateTrunc: {
                      date: "$$NOW",
                      unit: "week",
                      startOfWeek: "Mon",
                      timezone: "UTC"
                    }
                  }
                ]
              }
            }
          },
          {
            $group: {
              _id: {
                $isoDayOfWeek: {
                  date: "$createdAt",
                  timezone: "UTC"
                }
              },
              clicks: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: null,
              lastMonday: {
                $first: {
                  $dateSubtract: {
                    startDate: {
                      $dateTrunc: {
                        date: "$$NOW",
                        unit: "week",
                        startOfWeek: "Mon",
                        timezone: "UTC"
                      }
                    },
                    amount: 1,
                    unit: "week"
                  }
                }
              },
              stats: {
                $push: {
                  dayNum: "$_id",
                  clicks: "$clicks"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              days: {
                $map: {
                  input: [
                    // dayOffset represents how many days to add to Monday (Mon = +0, Tue = +1, etc.)
                    { num: 1, name: "Mon", dayOffset: 0 },
                    { num: 2, name: "Tue", dayOffset: 1 },
                    { num: 3, name: "Wed", dayOffset: 2 },
                    { num: 4, name: "Thu", dayOffset: 3 },
                    { num: 5, name: "Fri", dayOffset: 4 },
                    { num: 6, name: "Sat", dayOffset: 5 },
                    { num: 7, name: "Sun", dayOffset: 6 }
                  ],
                  as: "d",
                  in: {
                    day: "$$d.name",
                    // Dynamically calculate the exact date for this specific weekday
                    date: {
                      $dateAdd: {
                        startDate: "$lastMonday",
                        unit: "day",
                        amount: "$$d.dayOffset",
                        timezone: "UTC"
                      }
                    },
                    clicks: {
                      $let: {
                        vars: {
                          matchedDay: {
                            $filter: {
                              input: "$stats",
                              cond: {
                                $eq: [
                                  "$$this.dayNum",
                                  "$$d.num"
                                ]
                              }
                            }
                          }
                        },
                        in: {
                          $ifNull: [
                            {
                              $arrayElemAt: [
                                "$$matchedDay.clicks",
                                0
                              ]
                            },
                            0
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            $unwind: "$days"
          },
          {
            $project: {
              day: "$days.day",
              clicks: "$days.clicks",
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$days.date",
                  timezone: "UTC"
                }
              }
            }
          }
        ])
      ])

      // 2. Map current week data and merge previous week clicks by day
      const result = currentWeek.map(currDay => {
        const prevDay = previousWeek.find(p => p.day === currDay.day);
        return {
          day: currDay.day,
          clicks: currDay.clicks,
          previous: prevDay ? prevDay.clicks : 0
        };
      });

      return { weeklyClicks: result }

    } catch (error) {
      throw error;
    }
  }
  async last7DaysAgo(owner?: Types.ObjectId, urlId?: Types.ObjectId) {
    const ownerObjectId = typeof owner === 'string' ? new Types.ObjectId(owner) : owner;
    const matchQuery: any = {}
    if (urlId) {
      matchQuery.url = new Types.ObjectId(urlId)
    }
    if (owner) {
      matchQuery.owner = ownerObjectId
    }
    try {
      const data = await this.clickModel.aggregate([
        {
          // Step 1: Match records from exactly 7 days ago up until right now
          $match: {
            ...matchQuery,
            $expr: {
              $and: [
                {
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
                        amount: 6, // 6 days ago + today = 7 days total
                        unit: "day"
                      }
                    }
                  ]
                },
                {
                  $lte: ["$createdAt", "$$NOW"]
                }
              ]
            }
          }
        },
        {
          // Step 2: Group by the specific calendar date (YYYY-MM-DD)
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "UTC"
              }
            },
            clicks: { $sum: 1 }
          }
        },
        {
          // Step 3: Collect existing stats into an array and pass down the midnight anchor of 'today'
          $group: {
            _id: null,
            todayMidnight: {
              $first: {
                $dateTrunc: {
                  date: "$$NOW",
                  unit: "day",
                  timezone: "UTC"
                }
              }
            },
            stats: {
              $push: {
                dateStr: "$_id",
                clicks: "$clicks"
              }
            }
          }
        },
        {
          // Step 4: Generate a rolling 7-day offset sequence (0 is today, -1 is yesterday, etc.)
          $project: {
            _id: 0,
            days: {
              $map: {
                input: [0, -1, -2, -3, -4, -5, -6],
                as: "offset",
                in: {
                  // Calculate the actual Date object for this offset
                  letDate: {
                    $dateAdd: {
                      startDate: "$todayMidnight",
                      unit: "day",
                      amount: "$$offset",
                      timezone: "UTC"
                    }
                  }
                }
              }
            },
            stats: 1
          }
        },
        {
          // Step 5: Unwind the generated dates so we can process them individually
          $unwind: "$days"
        },
        {
          // Step 6: Extract the weekday name and formatted date string for each day
          $project: {
            dateStr: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$days.letDate",
                timezone: "UTC"
              }
            },
            dayName: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: [
                        {
                          $isoDayOfWeek: {
                            date: "$days.letDate",
                            timezone: "UTC"
                          }
                        },
                        1
                      ]
                    },
                    then: "Mon"
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $isoDayOfWeek: {
                            date: "$days.letDate",
                            timezone: "UTC"
                          }
                        },
                        2
                      ]
                    },
                    then: "Tue"
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $isoDayOfWeek: {
                            date: "$days.letDate",
                            timezone: "UTC"
                          }
                        },
                        3
                      ]
                    },
                    then: "Wed"
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $isoDayOfWeek: {
                            date: "$days.letDate",
                            timezone: "UTC"
                          }
                        },
                        4
                      ]
                    },
                    then: "Thu"
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $isoDayOfWeek: {
                            date: "$days.letDate",
                            timezone: "UTC"
                          }
                        },
                        5
                      ]
                    },
                    then: "Fri"
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $isoDayOfWeek: {
                            date: "$days.letDate",
                            timezone: "UTC"
                          }
                        },
                        6
                      ]
                    },
                    then: "Sat"
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $isoDayOfWeek: {
                            date: "$days.letDate",
                            timezone: "UTC"
                          }
                        },
                        7
                      ]
                    },
                    then: "Sun"
                  }
                ],
                default: ""
              }
            },
            stats: 1
          }
        },
        {
          // Step 7: Cross-reference our generated dates with actual database stats
          $project: {
            _id: 0,
            date: "$dateStr",
            day: "$dayName",
            clicks: {
              $let: {
                vars: {
                  matchedDay: {
                    $filter: {
                      input: "$stats",
                      cond: {
                        $eq: [
                          "$$this.dateStr",
                          "$dateStr"
                        ]
                      }
                    }
                  }
                },
                in: {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        "$$matchedDay.clicks",
                        0
                      ]
                    },
                    0
                  ]
                }
              }
            }
          }
        },
        {
          // Step 8: Sort chronologically (oldest day to today)
          $sort: { date: 1 }
        }
      ])

      return data
    } catch (error) {
      throw error
    }

  }
  async last30Days(owner?: Types.ObjectId, urlId?: Types.ObjectId) {
    const ownerObjectId = typeof owner === 'string' ? new Types.ObjectId(owner) : owner;
    const matchQuery: any = {}
    if (urlId) {
      matchQuery.url = new Types.ObjectId(urlId)
    }
    if (owner) {
      matchQuery.owner = ownerObjectId
    }

    console.log(matchQuery)

    try {
      const data = await this.clickModel.aggregate([
        {
          $match: {
            ...matchQuery,
            $expr: {
              $and: [
                {
                  $gte: [
                    "$createdAt",
                    {
                      $dateSubtract: {
                        startDate: { $dateTrunc: { date: "$$NOW", unit: "day", timezone: "UTC" } },
                        amount: 29,
                        unit: "day"
                      }
                    }
                  ]
                },
                {
                  $lte: ["$createdAt", "$$NOW"]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt"
                }
              }
            },
            clicks: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id.date",
            clicks: 1
          }
        },
        { $sort: { date: 1 } }
      ])

      return data;
    } catch (error) {
      throw error;
    }
  }

  async getDevicesData(day: number = 6) {
    try {
      const result = this.clickModel.aggregate([
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
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt"
                }
              }
            },
            desktop: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      { $toLower: "$device" },
                      "desktop"
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            mobile: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      { $toLower: "$device" },
                      "mobile"
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            tablet: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      { $toLower: "$device" },
                      "tablet"
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id.date",
            desktop: 1,
            mobile: 1,
            tablet: 1
          }
        },
        { $sort: { date: 1 } }
      ])
      return result
    } catch (error) {
      throw error;
    }
  }

  async getUniqueVisitor(owner?: Types.ObjectId, urlId?: Types.ObjectId) {
    const ownerObjectId = typeof owner === 'string' ? new Types.ObjectId(owner) : owner;
    const find: any = {}
    if (urlId) {
      find.url = new Types.ObjectId(urlId)
    }
    if (owner) {
      find.owner = ownerObjectId
    }
    const visitor = await this.clickModel.distinct(
      "visitorId",
      find
    )
    return visitor.length || 0
  }

  async getTotalClicks() {
    return await this.clickModel.countDocuments().exec()
  }

  async track(url: any, req: any, visitorId: string | undefined) {

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
        visitorId,
        ip,
        country: geoData.country,
        city: geoData.city,
        device: client.device_type,
        browser: client.browser,
        os: client.os
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
