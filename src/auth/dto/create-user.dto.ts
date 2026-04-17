import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword, MaxLength, MinLength } from "class-validator";
import { Role } from "../role.enum";
import { Match } from "src/decorators/match.decorator";

export class CreateUserDto {
    @MinLength(2, { message: "First name is too short!" })
    @MaxLength(20, { message: "Frist name is too big!" })
    @IsString()
    @IsNotEmpty()
    first_name!: string;

    @MaxLength(20, { message: "Last name is too big!" })
    @MinLength(2, { message: "Last name is too short!" })
    @IsString()
    @IsNotEmpty()
    last_name!: string;

    @IsEmail({}, { message: "Please provide a valid email address." })
    email!: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }, { message: "Password is not strong enough." })
    password!: string;

    @IsNotEmpty({ message: "Please confirm your password." })
    @Match("password", { message: "Confirm password do not match." })
    confirm_password!: string;

    @IsOptional()
    @IsEnum(Role, { message: "Valid role is required." })
    role?: Role
}

