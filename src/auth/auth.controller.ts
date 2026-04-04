import { Controller, Get, Post, Body, Request, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn-dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from './auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

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

  @Get("/profile")
  @UseGuards(AuthGuard)
  async getProfile(@Request() req) {
    const userId = req.user.sub
    const user = await this.userService.findUserById(userId)

    return user
  }

  @Patch('/profile')
  @UseGuards(AuthGuard)
  async updateUser(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub;

    const res = await this.authService.updateUserById(userId, updateUserDto)
    return res;
  }

}
