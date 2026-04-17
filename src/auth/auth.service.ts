import { UserService } from './../user/user.service';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignInDto } from './dto/signIn-dto';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from "bcryptjs";
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { generatePayload } from './create-payload';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/ResetPassword.dto';
import { Role } from './role.enum';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) { }

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

  async updateUserById(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userService.findUserAndUpdate(id, updateUserDto);

    return {
      access_token: await this.jwtService.signAsync(generatePayload(user))
    };
  }

  async changePassword(id: string, changePassword: ChangePasswordDto) {

    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(changePassword.password, salt);

    await this.userService.updatePassword(id, hashPassword)

    return { message: "Password changed!", status: 'success' }
  }



  async requestPasswordReset(data: ResetPasswordDto) {
    const email = data.email

    const user = await this.userService.findUserByEmail(email as string);
    if (!user) throw new NotFoundException()

    return { message: `We sent a password reset link to ${email}. Please check your inbox and follow the instructions to reset your password.`, status: 'success' }
  }
}
