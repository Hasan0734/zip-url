import { Transform, Type } from "class-transformer";
import { IsDate, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";

export class CreateUrlDto {
    @IsUrl()
    original_url!: string;

    @IsOptional()
    @Transform(({ value }) => (value === "" ? undefined : value))
    @MinLength(6, { message: "Alias is too short!" })
    @MaxLength(20, { message: "Alias is too big!" })
    @Matches(/^\S*$/, {
        message: "Alias should not contain spaces!"
    })
    custom_alias!: string;

    @IsOptional()
    @Transform(({ value }) => (value === "" ? undefined : value))
    @MinLength(4, { message: "Password is too short!" })
    @MaxLength(20, { message: "Password is too big!" })
    @IsString()
    password!: string;

    @IsOptional()
    @Transform(({ value }) => (value === "" ? undefined : value))
    @IsDate()
    @Type(() => Date)
    expires_at!: Date;

}
