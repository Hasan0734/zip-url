import { IsEmail, IsEnum, IsOptional, IsString, IsStrongPassword, MaxLength, MinLength } from "class-validator";
import { Role } from "../role.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    @MinLength(2, { message: "First name is too short!" })
    @MaxLength(20, { message: "Frist name is too big!" })
    first_name: string;

    @ApiProperty()
    @IsString()
    @MinLength(2, { message: "Last name is too short!" })
    @MaxLength(20, { message: "Last name is too big!" })
    last_name: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsStrongPassword()
    password: string;

    @IsOptional()
    @IsEnum(Role)
    role: string
}

