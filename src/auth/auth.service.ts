import { UserService } from './../user/user.service';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignInDto } from './dto/signIn-dto';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from "bcryptjs";
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailDto } from './dto/email.dto';
import { Role } from './enum/role.enum';
import { Types } from 'mongoose';
import crypto from 'crypto'
import { InjectModel } from '@nestjs/mongoose';
import { Tokens, TokensDocument } from 'src/user/schemas/token.schema';
import { ResetPasswordDto } from './dto/ResetPassword.dto';
import { MailService } from 'src/mail/mail.service';
import { TokenType } from './enum/tokentype.enum';
import { VerifyOtpDto } from './dto/verifyotp.dto';
import { generateOTP, generatePayload, handleHash } from 'src/common/utils/auth.util';




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
    const expires_at = new Date(Date.now() + 60 * 60 * 1000)

    const token = await this.createToken(user._id, TokenType.EMAIL_VERIFICATION, expires_at)
    const verifyUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;
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

    if (user.two_factor_enabled) {
      return await this.handleTwoFactor(user._id, user.email)
    }
    const tokens = this.generateTokens(user)

    return {
      message: "Login in successfully",
      status: 'success',
      ...tokens
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

      const expires_at = new Date(Date.now() + 60 * 60 * 1000)

      const token = await this.createToken(user._id, TokenType.RESET_PASSWORD, expires_at)

      await this.mailService.sendEmail({
        from: process.env.SECURITY_EMAIL,
        to: user.email,
        subject: 'Reset password',
        template: 'reset-password',
        context: {
          reset_link: `${process.env.APP_URL}/auth/reset-password?token=${token}`,
          name: user.first_name
        }
      })

      return {
        message:
          `We sent a password reset link to ${email}. Please check your inbox and follow the instructions to reset your password.`,
        status: 'success',
        reset_link: `${process.env.APP_URL}/auth/reset-password?token=${token}`
      }
    } catch (error) {
      throw error
    }
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const hashedToken = handleHash(resetDto.token);

    try {
      const record = await this.tokenModel.findOne({ token: hashedToken });
      this.validateToken(record)

      const salt = await bcrypt.genSalt(10)
      const hashPassword = await bcrypt.hash(resetDto.new_password, salt);
      const user = await this.userService.updatePassword(record.user_id, hashPassword);

      await this.mailService.sendEmail({
        from: process.env.SECURITY_EMAIL,
        to: user.email,
        subject: 'Changed password',
        template: 'changed-password',
        context: {
          name: user.first_name
        }
      })

      await this.tokenModel.deleteOne({ _id: record._id })
      return { message: "Password reseted", status: 'success' }

    } catch (error) {
      throw error
    }
  }

  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    try {

      const record = await this.tokenModel.findOne({ token: hashedToken, type: TokenType.EMAIL_VERIFICATION })

      this.validateToken(record)

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

    const expires_at = new Date(Date.now() + 60 * 60 * 1000)

    const token = await this.createToken(user._id, TokenType.EMAIL_VERIFICATION, expires_at)

    const verifyUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;


    await this.mailService.sendEmail({
      to: user.email,
      from: process.env.SMTP_FROM,
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

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {

    const hashed = handleHash(verifyOtpDto.otp)
    const user = await this.userService.findUserByEmail(verifyOtpDto.email);

    const record = await this.tokenModel.findOne({ token: hashed, type: TokenType.OTP_VERIFICATION });


    if (!record) {
      throw new BadRequestException('Invalid OTP')
    }
    if (record.expires_at < new Date()) {
      throw new UnauthorizedException("Expired OTP")
    }

    await this.tokenModel.deleteOne({ _id: record._id });
    const tokens = this.generateTokens(user)

    return { message: "OTP verified successfully", status: 'success', ...tokens }

  }

  async resendOtp(emailDto: EmailDto) {
    const user = await this.userService.findUserByEmail(emailDto.email);

    if (!user.two_factor_enabled) {
      return { message: "2FA is not enabled.", status: 'failed' }
    }
    await this.handleTwoFactor(user._id, user.email)
    return { message: 'OTP was sent, Check your inbox.', status: 'success' };
  }

  async refresh(refresh_token: string) {
    if (!refresh_token) throw new BadRequestException("Refresh token is required!")

    const hashed = handleHash(refresh_token);
    try {

      const record = await this.tokenModel.findOne({ token: hashed, type: TokenType.REFRESH_TOKEN });

      this.validateToken(record)

      const user = await this.userService.findUserById(record.user_id);
      await this.tokenModel.deleteOne({ _id: record._id }) // optional: rotate token (recommended)
      const tokens = this.generateTokens(user);
      return tokens;
    } catch (error) {
      throw error;
    }
  }

  async logout(refresh_token: string) {
    if (!refresh_token) throw new BadRequestException("Refresh token is required!")

    const hashed = handleHash(refresh_token);

    try {
      await this.tokenModel.deleteOne({ token: hashed, type: TokenType.REFRESH_TOKEN });
    } catch (error) {
      throw error
    }


  }

  async createToken(userId: Types.ObjectId, type: TokenType, expires_at: Date) {
    const rawToken = crypto.randomBytes(32).toString('hex');

    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      await this.tokenModel.deleteMany({ user_id: userId, type: type })
      await this.tokenModel.create({
        user_id: userId, token: hashedToken,
        type,
        expires_at
      })

      return rawToken;
    } catch (error) {
      throw error;
    }
  }

  async handleTwoFactor(userId: string, email: string) {
    const otp = generateOTP();
    const hashed = handleHash(otp);

    try {

      await this.tokenModel.deleteMany({ user_id: userId, type: TokenType.OTP_VERIFICATION })
      await this.tokenModel.create({
        user_id: userId, token: hashed,
        type: TokenType.OTP_VERIFICATION,
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      }) //5 minutes expires
      await this.mailService.sendEmail({
        to: email,
        subject: 'OTP verification code',
        template: 'otp-mail',
        context: {
          otp_code: otp,
        }
      })

      return {
        status: 'success',
        twoFARequired: true,
        message: `Verifiy your otp. Check your email. OTP is ${otp}. This otp testing perpus only.`

      }

    } catch (error) {
      throw new BadRequestException("2FA authentication required.")
    }
  }

  async generateTokens(user: any) {
    const refresh_token_expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days


    const access_token = await this.jwtService.signAsync(generatePayload(user));
    const refresh_token = await this.createToken(user._id, TokenType.REFRESH_TOKEN, refresh_token_expires)
    return {
      access_token, refresh_token
    }
  }

  async validateToken(record: TokensDocument) {

    if (!record) {
      throw new BadRequestException('Invalid token')
    }

    if (record.expires_at < new Date()) {
      throw new UnauthorizedException("Expired token")
    }
  }

}
