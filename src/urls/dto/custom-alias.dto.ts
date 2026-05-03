
import {  IsOptional,  Matches, MaxLength, MinLength } from "class-validator";


export class CustomAliasDto {

    @IsOptional()
    @MinLength(8, { message: "Alias is too short!" })
    @MaxLength(20, { message: "Alias is too big!" })
    @Matches(/^\S*$/, {
        message: "Alias should not contain spaces!"
    })
    custom_alias!: string;

}
