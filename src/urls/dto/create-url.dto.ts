import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString, IsUrl, Length, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUrlDto {
    @IsUrl()
    original_url: string;

    @IsOptional()
    @MinLength(6, { message: "Alias is too short!" })
    @MaxLength(20, { message: "Alias is too big!" })
    @Matches(/^\S*$/, {
        message: "Alias should not contain spaces!"
    })
    custom_alias: string;

    @IsOptional()
    @MinLength(4, { message: "Password is too short!" })
    @MaxLength(20, { message: "Password is too big!" })
    @IsString()
    password: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    expires_at: Date;

}
