
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Types } from "mongoose";


export class CustomAliasDto {

    @IsOptional()
    @MinLength(8, { message: "Alias is too short!" })
    @MaxLength(20, { message: "Alias is too big!" })
    @Matches(/^\S*$/, {
        message: "Alias should not contain spaces!"
    })
    custom_alias!: string;

    @IsOptional()
    @IsString()
    url_id!: Types.ObjectId


}
