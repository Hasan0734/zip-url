import { IsBoolean, IsDate, IsOptional, IsString, IsUrl, Length, Matches, MaxLength, MinLength } from "class-validator";
import { Transform, Type } from 'class-transformer';


export class UpdateUrlDto {


    @IsOptional()
    @MinLength(8, { message: "Alias is too short!" })
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

    @IsOptional()
    @IsBoolean()
    is_active!: boolean;
}
