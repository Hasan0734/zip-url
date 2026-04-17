import {  IsEmail, IsStrongPassword } from "class-validator";

export class RequestPasswordResetDto {
    @IsEmail()
    email!: string;

}


