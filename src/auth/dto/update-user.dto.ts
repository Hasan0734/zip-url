import { IsString, IsStrongPassword, MinLength, MaxLength, IsOptional } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MinLength(2, { message: "First name is too short!" })
    @MaxLength(20, { message: "Frist name is too big!" })
    first_name: string;

    @IsOptional()
    @IsString()
    @MinLength(2, { message: "Last name is too short!" })
    @MaxLength(20, { message: "Last name is too big!" })
    last_name: string;

    @IsOptional()
    @IsStrongPassword()
    password: string;

}


