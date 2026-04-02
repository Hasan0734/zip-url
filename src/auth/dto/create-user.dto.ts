import { IsEmail, IsEnum, IsOptional, IsString, IsStrongPassword, MaxLength, MinLength } from "class-validator";
import { Role } from "../role.enum";

export class CreateUserDto {
    @IsString()
    @MinLength(2, { message: "First name is too short!" })
    @MaxLength(20, { message: "Frist name is too big!" })
    first_name: string;

    @IsString()
    @MinLength(2, { message: "Last name is too short!" })
    @MaxLength(20, { message: "Last name is too big!" })
    last_name: string;

    @IsEmail()
    email: string;

    @IsStrongPassword()
    password: string;

    @IsOptional()
    @IsEnum(Role)
    role: string
}

