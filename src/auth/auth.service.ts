import { UserService } from './../user/user.service';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignInDto } from './dto/signIn-dto';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from "bcryptjs";
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { generatePayload } from './create-payload';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailDto } from './dto/email.dto';
import { Role } from './role.enum';
import { Types } from 'mongoose';
import crypto from 'crypto'
import { InjectModel } from '@nestjs/mongoose';
import { Tokens } from 'src/user/schemas/password-reset.schema';
import { ResetPasswordDto } from './dto/ResetPassword.dto';
import { MailService } from 'src/mail/mail.service';
import { TokenType } from './tokentype.enum';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService, @InjectModel(Tokens.name) private tokenModel, private mailService: MailService) { }

  async registerUser(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.userService.registerUser({ ...createUserDto, password, role: Role.User })


    if (!user) {
      return { message: "Registration failed", status: 'failed' };
    }

    const token = await this.createToken(user._id, TokenType.EMAIL_VERIFICATION)

    const verifyUrl = `http://localhost:3000/auth/verify-email?token=${token}`;


    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Welcome',
      template: 'welcome',
      context: {
        name: user.first_name,
      }
    })

    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Verify your email',
      template: 'email-verification',
      context: {
        verification_url: verifyUrl,
        name: user.first_name
      }
    })

    return { message: "Registration successfully.", status: 'success' };

  }

  async userSignIn(signInDto: SignInDto) {
    const user = await this.userService.findUserByEmail(signInDto.email);

    if (!user.is_verified) {
      throw new ForbiddenException('Please verify your email')
    }

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
    const user = await this.userService.updatePassword(id, hashPassword);

    await this.mailService.sendEmail({
      from: process.env.SECURITY_EMAIL,
      to: user.email,
      subject: 'Changed password',
      template: 'changed-password',
      context: {
        name: user.first_name,
        secure_account_link: ""
      }
    })

    return { message: "Password changed!", status: 'success' }
  }

  async requestPasswordReset(data: EmailDto) {
    try {
      const email = data.email
      const user = await this.userService.findUserByEmail(email);
      if (!user) throw new NotFoundException()

      const token = await this.createToken(user._id, TokenType.RESET_PASSWORD)

      await this.mailService.sendEmail({
        from: process.env.SECURITY_EMAIL,
        to: user.email,
        subject: 'Reset password',
        template: 'reset-password',
        context: {
          reset_link: `http://localhost:3000/auth/reset-password?token=${token}`,
          name: user.first_name
        }
      })

      return {
        message:
          `We sent a password reset link to ${email}. Please check your inbox and follow the instructions to reset your password.`,
        status: 'success'
      }
    } catch (error) {
      throw error
    }
  }

  async resetPassword(resetDto: ResetPasswordDto) {
      const hashedToken = crypto.createHash('sha256').update(resetDto.token).digest('hex');

    try {
      const resetRecord = await this.tokenModel.findOne({ token:  hashedToken});
      if (!resetRecord) {
        throw new BadRequestException('Invalid or expired token')
      }
      const salt = await bcrypt.genSalt(10)
      const hashPassword = await bcrypt.hash(resetDto.new_password, salt);
      const user = await this.userService.updatePassword(resetRecord.user_id, hashPassword);

      await this.mailService.sendEmail({
        from: process.env.SECURITY_EMAIL,
        to: user.email,
        subject: 'Changed password',
        template: 'changed-password',
        context: {
          name: user.first_name
        }
      })

      await this.tokenModel.deleteOne({ _id: resetRecord._id })
      return { message: "Password reseted", status: 'success' }

    } catch (error) {
      throw error
    }
  }

  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    try {

      const record = await this.tokenModel.findOne({ token: hashedToken, type: TokenType.EMAIL_VERIFICATION })

      if (!record) {
        throw new BadRequestException('Invalid or expired token.')
      }

      const user = await this.userService.findUserById(record.user_id);
      user.is_verified = true;
      await user.save();

      await this.tokenModel.deleteOne({ _id: record._id });
      return { message: "Email verified successfully", status: 'success' }
    } catch (error) {
      throw error;
    }

  }

  async resendEmailVerification(emailDto: EmailDto) {

    const user = await this.userService.findUserByEmail(emailDto.email);

    if (user.is_verified) {
      return { message: "Already verified email.", status: 'failed' }
    }

    const token = await this.createToken(user._id, TokenType.EMAIL_VERIFICATION)

    const verifyUrl = `http://localhost:3000/auth/verify-email?token=${token}`;


    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Verify your email',
      template: 'email-verification',
      context: {
        verification_url: verifyUrl,
        name: user.first_name
      }
    })

    return {
      message: "Verification link sent your email. Check your email inbox or spam forlder.",
      token: token
    }

  }

  async createToken(userId: Types.ObjectId, type: TokenType) {
    const rawToken = crypto.randomBytes(32).toString('hex');

    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      await this.tokenModel.deleteMany({ user_id: userId, type: type })
      await this.tokenModel.create({ user_id: userId, token: hashedToken, type })

      return rawToken;
    } catch (error) {
      throw error;
    }
  }


}
