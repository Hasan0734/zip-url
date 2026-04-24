import {  IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class VerifyOtpDto {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    otp!: string

}


