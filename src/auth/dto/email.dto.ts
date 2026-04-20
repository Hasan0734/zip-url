import {  IsEmail, IsStrongPassword } from "class-validator";

export class EmailDto {
    @IsEmail()
    email!: string;

}


