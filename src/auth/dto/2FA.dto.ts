import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from "class-validator";

export class twoFADto {
    @IsOptional()
    @IsBoolean()
    two_factor_enabled!: boolean
}


