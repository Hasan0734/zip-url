import { User } from './schemas/user.schema';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';
import { QueryTypes } from 'src/common/types';



@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel) { }

  async registerUser(createUserDto: CreateUserDto) {
    try {
      const { confirm_password, ...userData } = createUserDto;
      return await this.userModel.create(userData);
    } catch (err) {
      const error = err as { code?: number }
      const DUPLICATE_KEY_CODE = 11000;
      if (error.code === DUPLICATE_KEY_CODE) {
        throw new ConflictException("Email is already taken!")
      }
      throw error;
    }
  }
  async findAll(filter: any, queries: QueryTypes) {

    let fields = "-password "

    if (queries.fields) {
      fields = fields + queries.fields
    }


    try {
      const users = await this.userModel.find(filter)
        .skip(queries.skip)
        .limit(queries.limit)
        .select(fields)
        .sort(queries.sortBy)
        .populate("totalLink")
        .exec();
      const total = await this.userModel.find(filter).countDocuments()
      const page = Math.ceil(total / queries.limit)

      return { users, total, page, limit: queries.limit };
    } catch (error) {
      throw error;
    }
  }
  async findUserByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new NotFoundException("Your credentials is wrong!")
      }
      return user;
    } catch (error) {
      throw error
    }
  }
  async findUserById(_id: string) {
    try {
      const user = await this.userModel.findOne({ _id }).select("-password");
      if (!user) {
        throw new NotFoundException("Your credentials is wrong!")
      }
      return user;
    } catch (error) {
      throw error
    }
  }
  async findUserAndUpdate(_id: Types.ObjectId, userUpdateDto: UpdateUserDto) {
    try {
      const user = await this.userModel.findOneAndUpdate({ _id }, userUpdateDto, {
        returnDocument: 'after'
      }).select("-password")
      if (!user) {
        throw new NotFoundException("Your credentials is wrong!")
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
  async updatePassword(_id: Types.ObjectId, password: string) {
    try {
      const user = await this.userModel.findOneAndUpdate({ _id }, { password }, {
        returnDocument: 'after'
      }).select("-password")
      if (!user) {
        throw new NotFoundException("Your credentials is wrong!")
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
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            verifiedUsers: {
              $sum: {
                $cond: [
                  { $eq: ["$is_verified", true] },
                  1,
                  0
                ]
              }
            },
            notVerifiedUsers: {
              $sum: {
                $cond: [
                  { $eq: ["$is_verified", false] },
                  1,
                  0
                ]
              }
            },
            activeUsers: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "active"] },
                  1,
                  0
                ]
              }
            },
            pendingUsers: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "pending"] },
                  1,
                  0
                ]
              }
            },
            blockedUsers: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "block"] },
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
            totalUsers: 1,
            verifiedUsers: 1,
            notVerifiedUsers: 1,
            activeUsers: 1,
            pendingUsers: 1,
            blockedUsers: 1
          }
        }
      ]),
    ])

   const result = stats[0] || null

    return result

  }
}
