import { Controller, Get, Post, Body, Request, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn-dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from './auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiBody, ApiHeader } from '@nestjs/swagger';
import { User } from 'src/user/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private userService: UserService) { }

  @Post('/register')
  async create(@Body() createAuthDto: CreateUserDto) {
    const result = await this.authService.registerUser(createAuthDto);
    return result;
  }

  @Post('/signin')
  // @ApiBody({
  //   description: "Sign In to use existing user!",
  //   examples: {
  //     example1: {
  //       summary: 'Use this value',
  //       value: {
  //         email: "test@gmail.com",
  //         password: "Test123++"
  //       }
  //     }
  //   }
  // })

  async signIn(@Body() signInDto: SignInDto) {
    const result = await this.authService.userSignIn(signInDto)

    return result
  }

  @Get("/profile")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access_token')
  @ApiHeader({ name: "authorization" })
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
