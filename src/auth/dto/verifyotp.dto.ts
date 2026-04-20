import {  IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class VerifyOtpDto {
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    otp!: string

}


