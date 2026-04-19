import { ISendMailOptions } from "@nestjs-modules/mailer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class MailDto {

    @IsOptional()
    @IsEmail()
    from?: string

    @IsEmail()
    @IsNotEmpty()
    to!: string

    @MaxLength(255)
    @IsString()
    @IsNotEmpty()
    subject!: string


    @IsString()
    @IsNotEmpty()
    template!: string

    @IsOptional()
    context?: ISendMailOptions['context']

}


