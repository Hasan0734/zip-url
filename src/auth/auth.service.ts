import { UserService } from './../user/user.service';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignInDto } from './dto/signIn-dto';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from "bcryptjs";
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { generatePayload } from './create-payload';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/RequestPasswordReset.dto';
import { Role } from './role.enum';
import { Types } from 'mongoose';
import crypto from 'crypto'
import { InjectModel } from '@nestjs/mongoose';
import { PasswordReset } from 'src/user/schemas/password-reset.schema';
import { ResetPasswordDto } from './dto/ResetPassword.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService, @InjectModel(PasswordReset.name) private passwordResetModel) { }

  async registerUser(createUserDto: CreateUserDto) {

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.userService.registerUser({ ...createUserDto, password, role: Role.User })
    if (user.first_name) {
      return { message: "Registerd successfully.", status: 'success' };

    }
    return user;
  }

  async userSignIn(signInDto: SignInDto) {
    const user = await this.userService.findUserByEmail(signInDto.email);
    const checkPassword = await bcrypt.compare(signInDto.password, user.password);

    if (!checkPassword) {
      throw new UnauthorizedException()
    }

    return {
      access_token: await this.jwtService.signAsync(generatePayload(user))
    };
  }

  async updateUserById(id: Types.ObjectId, updateUserDto: UpdateUserDto) {
    const user = await this.userService.findUserAndUpdate(id, updateUserDto);

    return {
      access_token: await this.jwtService.signAsync(generatePayload(user))
    };
  }

  async changePassword(id: Types.ObjectId, changePassword: ChangePasswordDto) {
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(changePassword.new_password, salt);

    await this.userService.updatePassword(id, hashPassword)
    return { message: "Password changed!", status: 'success' }
  }



  async requestPasswordReset(data: RequestPasswordResetDto) {
    try {
      const email = data.email

      const user = await this.userService.findUserByEmail(email);
      if (!user) throw new NotFoundException()

      const token = crypto.randomBytes(32).toString('hex')

      await this.passwordResetModel.create({ token, user_id: user._id })

      return { message: `We sent a password reset link to ${email}. Please check your inbox and follow the instructions to reset your password.`, status: 'success', token: token }
    } catch (error) {
      throw error
    }
  }

  async resetPassword(resetDto: ResetPasswordDto) {

    try {
      const resetRecord = await this.passwordResetModel.findOne({ token: resetDto.token });

      if (!resetRecord) {
        throw new BadRequestException('Invalid or expired token')
      }

      const salt = await bcrypt.genSalt(10)
      const hashPassword = await bcrypt.hash(resetDto.new_password, salt);

      await this.userService.updatePassword(resetRecord.user_id, hashPassword)
      return { message: "Password reseted", status: 'success' }

    } catch (error) {
      throw error
    }
  }
}
