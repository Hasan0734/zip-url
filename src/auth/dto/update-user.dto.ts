import { IsString, IsStrongPassword } from "class-validator";
import { CreateUserDto } from "./create-user.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsString()
    first_name: string;

    @IsString()
    last_name: string;

    @IsStrongPassword()
    password: string;

}


