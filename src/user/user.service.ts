import { User } from './schemas/user.schema';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { ObjectId, Types } from 'mongoose';
import { twoFADto } from 'src/auth/dto/2FA.dto';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';
import { Role } from 'src/auth/enum/role.enum';
import { QueryTypes } from 'src/common/types';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel) { }

  async registerUser(createUserDto: CreateUserDto) {
    try {
      const { confirm_password, ...userData } = createUserDto;
      return await this.userModel.create(userData);
    } catch (err) {
      const error = err as { code?: number };
      const DUPLICATE_KEY_CODE = 11000;
      if (error.code === DUPLICATE_KEY_CODE) {
        throw new ConflictException('Email is already taken!');
      }
      throw error;
    }
  }

  async findAll(filter: any, queries: QueryTypes) {
    let fields = '-password ';

    if (queries.fields) {
      fields = fields + queries.fields;
    }

    try {
      const users = await this.userModel
        .find(filter)
        .skip(queries.skip)
        .limit(queries.limit)
        .select(fields)
        .sort(queries.sortBy)
        .populate('totalLink')
        .exec();
      const total = await this.userModel.find(filter).countDocuments();
      const page = Math.ceil(total / queries.limit);

      return { users, total, page, limit: queries.limit };
    } catch (error) {
      throw error;
    }
  }

  async findUserByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new NotFoundException('Your credentials is wrong!');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findUserById(_id: Types.ObjectId, select: string = "-password") {
    try {
      const user = await this.userModel.findOne({ _id }).select(select);
      if (!user) {
        throw new NotFoundException('Your credentials is wrong!');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async deleteUserById(_id: Types.ObjectId) {
    try {
      const user = await this.userModel.findByIdAndDelete({ _id: _id });
      if (!user) {
        throw new NotFoundException('User not found!');
      }
      return {
        message: 'User deleted successfully',
        success: true,
      };
    } catch (e: any) {
      throw e;
    }
  }

  async findUserAndUpdate(_id: Types.ObjectId, userUpdateDto: UpdateUserDto | twoFADto) {
    try {
      const user = await this.userModel
        .findOneAndUpdate({ _id }, userUpdateDto, {
          returnDocument: 'after',
        })
        .select('-password');
      if (!user) {
        throw new NotFoundException('Your credentials is wrong!');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async changeUserStatus(_id: Types.ObjectId, status: Role) {
    try {

      const user = await this.userModel
        .findOneAndUpdate({ _id }, { status }, {
          returnDocument: 'after',
        })
      if (!user) {
        throw new NotFoundException('Your credentials is wrong!');
      }
      return {
        success: true,
        message: "User status changed!"
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(_id: Types.ObjectId, password: string) {
    try {
      const user = await this.userModel
        .findOneAndUpdate(
          { _id },
          { password },
          {
            returnDocument: 'after',
          },
        )
        .select('-password');
      if (!user) {
        throw new NotFoundException('Your credentials is wrong!');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUsersStats() {
    const [stats] = await Promise.all([
      this.userModel.aggregate([
        {
          $facet: {
            verifiedCounts: [
              {
                $group: {
                  _id: null,
                  verified: {
                    $sum: {
                      $cond: [{ $eq: ['$is_verified', true] }, 1, 0],
                    },
                  },
                  notVerified: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ['$is_verified', false],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  totalUsers: { $sum: 1 },
                  todayCreated: {
                    $sum: {
                      $cond: [
                        {
                          $gte: [
                            '$createdAt',
                            {
                              $dateTrunc: {
                                date: '$$NOW',
                                unit: 'day',
                              },
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            statusCounts: [
              {
                $group: {
                  _id: null,
                  activeUsers: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
                    },
                  },
                  pendingUsers: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
                    },
                  },
                  blockUsers: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'block'] }, 1, 0],
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 0,
            verified: {
              $ifNull: [
                {
                  $arrayElemAt: ['$verifiedCounts.verified', 0],
                },
                0,
              ],
            },
            notVerified: {
              $ifNull: [
                {
                  $arrayElemAt: ['$verifiedCounts.notVerified', 0],
                },
                0,
              ],
            },
            activeUsers: {
              $ifNull: [
                {
                  $arrayElemAt: ['$statusCounts.activeUsers', 0],
                },
                0,
              ],
            },
            pendingUsers: {
              $ifNull: [
                {
                  $arrayElemAt: ['$statusCounts.pendingUsers', 0],
                },
                0,
              ],
            },
            blockUsers: {
              $ifNull: [
                {
                  $arrayElemAt: ['$statusCounts.blockUsers', 0],
                },
                0,
              ],
            },
            totalUsers: {
              $ifNull: [
                {
                  $arrayElemAt: ['$verifiedCounts.totalUsers', 0],
                },
                0,
              ],
            },
            todayCreated: {
              $ifNull: [
                {
                  $arrayElemAt: ['$verifiedCounts.todayCreated', 0],
                },
                0,
              ],
            },
          },
        },
      ]),
    ]);

    const result = stats[0] || null;

    return result;
  }

  async getAnalytics(day: number) {
    try {
      const result = await this.userModel.aggregate([
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

}
