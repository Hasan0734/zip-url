import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "src/auth/guard/auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorator/roles.decorator";
import { Role } from "src/auth/enum/role.enum";

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UserService) { }

    @Get()
    // @UseGuards(AuthGuard)
    @Roles(Role.Admin)
    async findAll() {
       
        return await this.userService.findAll()
    }


}