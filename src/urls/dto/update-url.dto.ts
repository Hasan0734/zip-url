import { PartialType } from '@nestjs/mapped-types';
import { CreateUrlDto } from './create-url.dto';
import { IsBoolean, IsDate, IsOptional, IsString, IsUrl, Length, Matches, MaxLength, MinLength } from "class-validator";
import { Type } from 'class-transformer';


export class UpdateUrlDto {


    @IsOptional()
    @MinLength(8, { message: "Alias is too short!" })
    @MaxLength(20, { message: "Alias is too big!" })
    @Matches(/^\S*$/, {
        message: "Alias should not contain spaces!"
    })
    custom_alias: string;

    @IsOptional()
    @Length(4, 10)
    password: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    expires_at: Date;

    @IsOptional()
    @IsBoolean()
    is_active: boolean;
}
