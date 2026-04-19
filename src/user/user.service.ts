import { User } from './schemas/user.schema';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';


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
  async findUserByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new NotFoundException()
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
        throw new NotFoundException()
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
        throw new NotFoundException()
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
        throw new NotFoundException()
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}
