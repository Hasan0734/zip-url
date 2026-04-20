import { Controller, Get, Post, Body, Request, UseGuards, Patch, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn-dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from './auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailDto } from './dto/email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/ResetPassword.dto';
import { EmailVerifiedGuard } from './email-verified.guard';
import { RequireVerified } from './require-verified.decorator';
import { VerifyOtpDto } from './dto/verifyotp.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private userService: UserService) { }

  @Post('/register')
  async create(@Body() createAuthDto: CreateUserDto) {
    const result = await this.authService.registerUser(createAuthDto);
    return result;
  }

  @Post('/signin')
  async signIn(@Body() signInDto: SignInDto) {
    const result = await this.authService.userSignIn(signInDto)
    return result
  }

  @Post("/request-password-reset")
  async requestPasswordRequest(@Body() data: EmailDto) {

    return this.authService.requestPasswordReset(data)
  }

  @Post("/reset-password")
  async resetPassword(@Body() passwordDto: ResetPasswordDto) {
    return this.authService.resetPassword(passwordDto)
  }

  @Patch("/change-password")
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @RequireVerified()
  async changePassword(@Body() passwordDto: ChangePasswordDto, @Request() req) {
    const userId = req.user.sub
    return this.authService.changePassword(userId, passwordDto)
  }

  @Get("/profile")
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @RequireVerified()
  async getProfile(@Request() req) {
    const userId = req.user.sub
    const user = await this.userService.findUserById(userId)
    return user
  }


  @Patch('/profile')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @RequireVerified()
  async updateUser(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub;

    const res = await this.authService.updateUserById(userId, updateUserDto)
    return res;
  }


  @Get('/verify-email')
  async VerifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token)

  }

  @Post('/resend-verification')
  async resendEmailVerification(@Body() email: EmailDto) {
    return this.authService.resendEmailVerification(email)
  }

  @Post('/verify-otp')
  async verifiyOtp(@Body() otpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(otpDto)

  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('/resend-otp')
  async resendOtp(@Body() email: EmailDto) {
    return this.authService.resendOtp(email)

  }



}
