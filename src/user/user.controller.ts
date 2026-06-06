import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enum/role.enum';
import mongoose, { Types } from 'mongoose';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) { }

  @Get()
  // @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  async findAll(@Query() queries) {
    const { sort, page = '1', limit, fields, search } = queries;

    const filters: any = Object.fromEntries(
      Object.entries(queries).filter(
        ([key]) => !['sort', 'page', 'limit', 'fields', 'search'].includes(key),
      ),
    );

    if (search) {
      const searchRegex = new RegExp(queries?.search, 'i');

      filters.$or = [
        { email: { $regex: searchRegex } },
        { first_name: { $regex: searchRegex } },
        { last_name: { $regex: searchRegex } },
      ];
    }

    const parsedLimit = Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT);

    const parsedPage = Math.max(Number(page) || 1, 1);

    const queryOption = {
      limit: parsedLimit,
      skip: (parsedPage - 1) * parsedLimit,
      ...(sort && {
        sortBy: (sort as string).split(',').join(' '),
      }),
      ...(fields && {
        fields: (fields as string).split(',').join(' '),
      }),
    };

    return await this.userService.findAll(filters, queryOption);
  }

  @Get('/stats/summary')
  @Roles(Role.Admin)
  async getUsersStats() {
    return await this.userService.getUsersStats();
  }

  @Delete('/:id')
  @Roles(Role.Admin)
  async deleteUser(@Param('id') id: Types.ObjectId) {
    return await this.userService.deleteUserById(id);
  }

  @Patch('/:id')
  @Roles(Role.Admin)
  async changeStatus(@Param('id') id: Types.ObjectId, @Body() body) {
    return await this.userService.changeUserStatus(id, body.status);
  }
}
